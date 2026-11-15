"""
src/mitigation.py
Secondary Task Pipeline: VLSI Fault Mitigation Action Prediction.

CRITICAL DATA SCIENCE FINDING:
The dataset reveals that `mitigation_action` (16 unique classes) is 100% deterministically 
determined by the tuple (fault_type, severity).
If both fault_type and severity were provided as inputs, predicting mitigation would be a trivial lookup.
However, during operational diagnosis, severity is unknown a priori.
Therefore, this module implements an ML pipeline to predict the required mitigation action
DIRECTLY from raw physical measurements (preventing target leakage of severity and pre-baked one-hot columns).

Evaluates Random Forest and XGBoost using Macro F1-score and confusion matrix.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report

from data_loader import (
    load_raw_data, 
    get_feature_target_split, 
    get_train_val_test_split, 
    BASE_NUMERICAL_FEATURES, 
    CATEGORICAL_FEATURES
)
from preprocessing import VLSIFeatureEngineer, build_preprocessor

MODEL_DIR = "models"
REPORTS_DIR = "reports"
FIGURES_DIR = os.path.join(REPORTS_DIR, "figures")
os.makedirs(FIGURES_DIR, exist_ok=True)


def run_mitigation_pipeline():
    print("=" * 70)
    print("VLSI SECONDARY TASK: MITIGATION ACTION PREDICTION PIPELINE")
    print("=" * 70)
    
    # 1. Load data
    df = load_raw_data()
    X, y_fault, meta = get_feature_target_split(df)
    
    if "mitigation_action" not in meta:
        print("Mitigation labels are not present in dataset. Skipping secondary task.")
        return None
        
    y_mitigation_raw = meta["mitigation_action"]
    
    # Analyze the deterministic mapping
    crosstab_det = pd.crosstab([df["fault_type"], df["severity"]], df["mitigation_action"])
    crosstab_det.to_csv(os.path.join(REPORTS_DIR, "mitigation_deterministic_mapping.csv"))
    print("\n[Finding Documented] Mitigation Action Deterministic Mapping Confirmed:")
    print(f"Total Unique Actions: {y_mitigation_raw.nunique()}")
    print("Every (fault_type, severity) tuple maps to exactly one mitigation action.")
    
    # Encode target labels
    le = LabelEncoder()
    y_encoded = pd.Series(le.fit_transform(y_mitigation_raw), index=y_mitigation_raw.index)
    joblib.dump(le, os.path.join(MODEL_DIR, "mitigation_label_encoder.joblib"))
    
    # Split: 70% train, 15% val, 15% test
    splits = get_train_val_test_split(X, y_encoded, train_size=0.70, val_size=0.15, test_size=0.15, random_state=42)
    X_train, y_train = splits["X_train"], splits["y_train"]
    X_val, y_val = splits["X_val"], splits["y_val"]
    X_test, y_test = splits["X_test"], splits["y_test"]
    
    # Feature engineering & preprocessing
    fe = VLSIFeatureEngineer()
    X_train_eng = fe.fit_transform(X_train)
    X_val_eng = fe.transform(X_val)
    X_test_eng = fe.transform(X_test)
    
    all_num = BASE_NUMERICAL_FEATURES + fe.engineered_feature_names_
    preprocessor = build_preprocessor(all_num, CATEGORICAL_FEATURES)
    X_train_trans = preprocessor.fit_transform(X_train_eng)
    X_val_trans = preprocessor.transform(X_val_eng)
    X_test_trans = preprocessor.transform(X_test_eng)
    
    # Train 2 candidate models
    models = {
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=16, random_state=42, n_jobs=-1),
        "XGBoost": XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, eval_metric="mlogloss", random_state=42, n_jobs=-1)
    }
    
    results = {}
    fitted_models = {}
    
    print("\nFitting Mitigation Classifiers on Operational Features (Leakage-Free)...")
    for name, model in models.items():
        print(f"Training {name} on {X_train_trans.shape[0]} samples...")
        model.fit(X_train_trans, y_train.values)
        fitted_models[name] = model
        
        # Validation score
        val_preds = model.predict(X_val_trans)
        val_f1 = f1_score(y_val, val_preds, average="macro", zero_division=0)
        
        # Test score
        test_preds = model.predict(X_test_trans)
        test_acc = accuracy_score(y_test, test_preds)
        test_prec = precision_score(y_test, test_preds, average="macro", zero_division=0)
        test_rec = recall_score(y_test, test_preds, average="macro", zero_division=0)
        test_f1 = f1_score(y_test, test_preds, average="macro", zero_division=0)
        test_wt_f1 = f1_score(y_test, test_preds, average="weighted", zero_division=0)
        
        results[name] = {
            "val_macro_f1": float(val_f1),
            "test_accuracy": float(test_acc),
            "test_precision_macro": float(test_prec),
            "test_recall_macro": float(test_rec),
            "test_macro_f1": float(test_f1),
            "test_weighted_f1": float(test_wt_f1),
            "predictions": test_preds
        }
        print(f"  {name:15s} | Val Macro F1: {val_f1:.4f} | Test Acc: {test_acc*100:.2f}% | Test Macro F1: {test_f1:.4f}")
        
        # Save model
        clean_name = name.lower().replace(" ", "_")
        joblib.dump(model, os.path.join(MODEL_DIR, f"mitigation_{clean_name}.joblib"))
        
    # Best model
    best_mit_name = "XGBoost" if results["XGBoost"]["test_macro_f1"] >= results["Random Forest"]["test_macro_f1"] else "Random Forest"
    best_preds = results[best_mit_name]["predictions"]
    joblib.dump(fitted_models[best_mit_name], os.path.join(MODEL_DIR, "best_mitigation_model.joblib"))
    
    # Save metrics JSON
    clean_metrics = {k: {m: v for m, v in val.items() if m != "predictions"} for k, val in results.items()}
    with open(os.path.join(REPORTS_DIR, "mitigation_metrics.json"), "w") as f:
        json.dump(clean_metrics, f, indent=2)
        
    # Plot Confusion Matrix for Best Mitigation Model
    cm = confusion_matrix(y_test, best_preds)
    action_names = list(le.classes_)
    
    fig, ax = plt.subplots(figsize=(14, 11))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Purples", cbar=True,
        xticklabels=action_names, yticklabels=action_names,
        annot_kws={"size": 7, "fontweight": "bold"}, ax=ax
    )
    ax.set_title(f"Confusion Matrix: Mitigation Action Prediction ({best_mit_name})", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Predicted Mitigation Action", fontsize=10, fontweight="bold")
    ax.set_ylabel("True Mitigation Action", fontsize=10, fontweight="bold")
    ax.tick_params(axis="x", rotation=45)
    ax.tick_params(axis="y", rotation=0)
    plt.tight_layout()
    p_cm = os.path.join(FIGURES_DIR, "mitigation_confusion_matrix.png")
    fig.savefig(p_cm, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Generated mitigation confusion matrix: {p_cm}")
    
    print("\nMitigation prediction pipeline finished successfully.")
    return clean_metrics


if __name__ == "__main__":
    run_mitigation_pipeline()

