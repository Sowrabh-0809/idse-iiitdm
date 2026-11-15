"""
src/train.py
Main training pipeline for the VLSI Fault Classification models:
1. Dummy Classifier (Baseline)
2. Logistic Regression (Linear Multiclass)
3. Random Forest Classifier (Non-linear Bagging Ensemble)
4. XGBoost Classifier (Gradient Boosted Decision Trees)

Enforces strict data hygiene:
- 70/15/15 Stratified Train/Val/Test split.
- 5-Fold Stratified Cross-Validation on Train data.
- Preprocessors fit exclusively on Train data to prevent data leakage.
- Models and metrics serialized to models/ and reports/.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any

from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from data_loader import (
    load_raw_data, 
    get_feature_target_split, 
    get_train_val_test_split, 
    BASE_NUMERICAL_FEATURES, 
    CATEGORICAL_FEATURES,
    FAULT_CLASS_MAP
)
from preprocessing import VLSIFeatureEngineer, build_preprocessor

MODEL_DIR = "models"
REPORTS_DIR = "reports"
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)


def train_and_evaluate_cv(
    models: Dict[str, Any], 
    X_train_trans: np.ndarray, 
    y_train: np.ndarray, 
    cv_folds: int = 5
) -> Dict[str, Dict[str, float]]:
    """Performs 5-Fold Stratified Cross-Validation on the Training split."""
    cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)
    cv_results = {}
    scoring = {
        "accuracy": "accuracy",
        "macro_f1": "f1_macro",
        "weighted_f1": "f1_weighted"
    }
    
    print("\n--- Running 5-Fold Stratified Cross-Validation on Train Split (N=21,000) ---")
    for name, model in models.items():
        print(f"Running CV for {name}...")
        scores = cross_validate(model, X_train_trans, y_train, cv=cv, scoring=scoring, n_jobs=-1)
        cv_results[name] = {
            "cv_accuracy_mean": float(np.mean(scores["test_accuracy"])),
            "cv_accuracy_std": float(np.std(scores["test_accuracy"])),
            "cv_macro_f1_mean": float(np.mean(scores["test_macro_f1"])),
            "cv_macro_f1_std": float(np.std(scores["test_macro_f1"])),
            "cv_weighted_f1_mean": float(np.mean(scores["test_weighted_f1"])),
            "cv_weighted_f1_std": float(np.std(scores["test_weighted_f1"])),
        }
        print(
            f"  {name:20s} | CV Accuracy: {cv_results[name]['cv_accuracy_mean']*100:.2f}% (±{cv_results[name]['cv_accuracy_std']*100:.2f}%) "
            f"| CV Macro F1: {cv_results[name]['cv_macro_f1_mean']:.4f}"
        )
        
    return cv_results


def evaluate_on_validation(
    models: Dict[str, Any], 
    X_val_trans: np.ndarray, 
    y_val: np.ndarray
) -> Dict[str, Dict[str, float]]:
    """Evaluates fitted models on the strictly held-out Validation split (N=4,500)."""
    val_results = {}
    print("\n--- Evaluating Models on Validation Split (N=4,500) ---")
    for name, model in models.items():
        preds = model.predict(X_val_trans)
        acc = accuracy_score(y_val, preds)
        prec_macro = precision_score(y_val, preds, average="macro", zero_division=0)
        rec_macro = recall_score(y_val, preds, average="macro", zero_division=0)
        f1_mac = f1_score(y_val, preds, average="macro", zero_division=0)
        f1_wt = f1_score(y_val, preds, average="weighted", zero_division=0)
        
        val_results[name] = {
            "val_accuracy": float(acc),
            "val_precision_macro": float(prec_macro),
            "val_recall_macro": float(rec_macro),
            "val_macro_f1": float(f1_mac),
            "val_weighted_f1": float(f1_wt)
        }
        print(
            f"  {name:20s} | Val Accuracy: {acc*100:.2f}% | Val Macro F1: {f1_mac:.4f} | Val Weighted F1: {f1_wt:.4f}"
        )
    return val_results


def run_training_pipeline():
    print("=" * 70)
    print("VLSI FAULT DIAGNOSIS: MACHINE LEARNING TRAINING PIPELINE")
    print("=" * 70)
    
    # 1. Load data
    df = load_raw_data()
    X, y, meta = get_feature_target_split(df)
    
    # 2. Split data (70% train, 15% val, 15% test)
    splits = get_train_val_test_split(X, y, meta, train_size=0.70, val_size=0.15, test_size=0.15, random_state=42)
    X_train, y_train = splits["X_train"], splits["y_train"]
    X_val, y_val = splits["X_val"], splits["y_val"]
    X_test, y_test = splits["X_test"], splits["y_test"]
    
    print(f"Data Splitting Completed:")
    print(f"  Training Set   : {X_train.shape[0]} samples (70.0%)")
    print(f"  Validation Set : {X_val.shape[0]} samples (15.0%)")
    print(f"  Test Set       : {X_test.shape[0]} samples (15.0%)")
    
    # Save test set for evaluate.py
    joblib.dump(splits, os.path.join(MODEL_DIR, "data_splits.joblib"))
    
    # 3. Feature engineering
    fe = VLSIFeatureEngineer()
    X_train_eng = fe.fit_transform(X_train)
    X_val_eng = fe.transform(X_val)
    X_test_eng = fe.transform(X_test)
    
    joblib.dump(fe, os.path.join(MODEL_DIR, "feature_engineer.joblib"))
    
    # 4. Preprocessing (StandardScaler + OneHotEncoder)
    all_num = BASE_NUMERICAL_FEATURES + fe.engineered_feature_names_
    preprocessor = build_preprocessor(all_num, CATEGORICAL_FEATURES)
    
    # Fit preprocessor ONLY on training data
    X_train_trans = preprocessor.fit_transform(X_train_eng)
    X_val_trans = preprocessor.transform(X_val_eng)
    X_test_trans = preprocessor.transform(X_test_eng)
    
    joblib.dump(preprocessor, os.path.join(MODEL_DIR, "preprocessor.joblib"))
    
    # Get feature names after one-hot encoding
    cat_encoder = preprocessor.named_transformers_["cat"]
    cat_feature_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
    processed_feature_names = all_num + cat_feature_names
    with open(os.path.join(MODEL_DIR, "feature_names.json"), "w") as f:
        json.dump(processed_feature_names, f, indent=2)
        
    print(f"Preprocessing completed. Transformed feature dimension: {X_train_trans.shape[1]}")
    
    # 5. Define candidate models
    models = {
        "Dummy Classifier": DummyClassifier(strategy="most_frequent", random_state=42),
        "Logistic Regression": LogisticRegression(
            max_iter=1000, 
            C=1.0, 
            solver="lbfgs", 
            random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=100, 
            max_depth=16, 
            min_samples_split=5, 
            random_state=42, 
            n_jobs=-1
        ),
        "XGBoost": XGBClassifier(
            n_estimators=100, 
            max_depth=6, 
            learning_rate=0.1, 
            subsample=0.8, 
            colsample_bytree=0.8, 
            eval_metric="mlogloss", 
            random_state=42, 
            n_jobs=-1
        )
    }
    
    # 6. Stratified Cross-Validation on Train split
    cv_metrics = train_and_evaluate_cv(models, X_train_trans, y_train.values)
    
    # 7. Fit models on full Train split
    print("\n--- Fitting All Models on Full Train Split (N=21,000) ---")
    fitted_models = {}
    for name, model in models.items():
        print(f"Fitting {name}...")
        model.fit(X_train_trans, y_train.values)
        fitted_models[name] = model
        
        # Save individual model
        clean_name = name.lower().replace(" ", "_")
        joblib.dump(model, os.path.join(MODEL_DIR, f"{clean_name}.joblib"))
        
    # 8. Evaluate on Validation split for model selection
    val_metrics = evaluate_on_validation(fitted_models, X_val_trans, y_val.values)
    
    # Combine training CV and validation metrics
    summary_report = {}
    best_model_name = None
    best_val_f1 = -1.0
    
    for name in models.keys():
        summary_report[name] = {
            **cv_metrics[name],
            **val_metrics[name]
        }
        if val_metrics[name]["val_macro_f1"] > best_val_f1:
            best_val_f1 = val_metrics[name]["val_macro_f1"]
            best_model_name = name
            
    print(f"\n>>> Best Performing Model on Validation Set: {best_model_name} (Macro F1: {best_val_f1:.4f})")
    joblib.dump(fitted_models[best_model_name], os.path.join(MODEL_DIR, "best_model.joblib"))
    
    with open(os.path.join(REPORTS_DIR, "train_val_metrics.json"), "w") as f:
        json.dump({
            "best_model": best_model_name,
            "metrics": summary_report
        }, f, indent=2)
        
    print(f"Training pipeline complete. Artifacts saved in '{MODEL_DIR}/' and '{REPORTS_DIR}/'.")
    return summary_report


if __name__ == "__main__":
    run_training_pipeline()
