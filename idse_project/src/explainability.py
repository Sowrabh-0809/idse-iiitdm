"""
src/explainability.py
Explainable AI (XAI) using SHAP (SHapley Additive exPlanations) for the best-performing model.
Generates:
1. Global Feature Importance (mean |SHAP| values across all classes).
2. SHAP Summary Plot (distribution of impact on output predictions).
3. SHAP Bar Plot of top contributors.
4. Local Sample Explanations (individual prediction rationale for each fault class).
5. High-resolution figures saved in reports/figures/ and importance metrics saved in reports/.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import shap

from data_loader import FAULT_CLASS_MAP

MODEL_DIR = "models"
REPORTS_DIR = "reports"
FIGURES_DIR = os.path.join(REPORTS_DIR, "figures")
os.makedirs(FIGURES_DIR, exist_ok=True)

CLASS_NAMES = [FAULT_CLASS_MAP[i] for i in range(6)]


def run_explainability_pipeline(n_samples: int = 500):
    print("=" * 70)
    print("VLSI FAULT DIAGNOSIS: EXPLAINABLE AI (SHAP) INTERPRETATION")
    print("=" * 70)
    
    # 1. Load artifacts
    splits = joblib.load(os.path.join(MODEL_DIR, "data_splits.joblib"))
    fe = joblib.load(os.path.join(MODEL_DIR, "feature_engineer.joblib"))
    preprocessor = joblib.load(os.path.join(MODEL_DIR, "preprocessor.joblib"))
    best_model = joblib.load(os.path.join(MODEL_DIR, "best_model.joblib"))
    
    with open(os.path.join(MODEL_DIR, "feature_names.json"), "r") as f:
        feature_names = json.load(f)
        
    X_test_raw = splits["X_test"]
    y_test = splits["y_test"].values
    
    # Transform test set
    X_test_eng = fe.transform(X_test_raw)
    X_test_trans = preprocessor.transform(X_test_eng)
    
    # Sample subset for fast and representative SHAP computation
    np.random.seed(42)
    sample_indices = np.random.choice(len(X_test_trans), size=min(n_samples, len(X_test_trans)), replace=False)
    X_sample = X_test_trans[sample_indices]
    y_sample = y_test[sample_indices]
    
    print(f"Computing TreeExplainer SHAP values for {len(X_sample)} test samples across {len(feature_names)} features...")
    explainer = shap.TreeExplainer(best_model)
    shap_values = explainer.shap_values(X_sample)
    
    # Handling SHAP value shapes:
    # In multiclass XGBoost/RF, shap_values is a list of [n_samples, n_features] per class
    # or a 3D ndarray [n_samples, n_features, n_classes]
    if isinstance(shap_values, list):
        # List of length 6
        n_classes = len(shap_values)
        mean_abs_per_class = np.array([np.mean(np.abs(sv), axis=0) for sv in shap_values]) # [6, n_features]
        global_importance = np.mean(mean_abs_per_class, axis=0)
    elif len(shap_values.shape) == 3:
        # 3D array: [n_samples, n_features, n_classes]
        n_classes = shap_values.shape[2]
        mean_abs_per_class = np.mean(np.abs(shap_values), axis=0).T # [n_classes, n_features]
        global_importance = np.mean(mean_abs_per_class, axis=0)
    else:
        # 2D array
        global_importance = np.mean(np.abs(shap_values), axis=0)
        mean_abs_per_class = None
        
    # Build Global Feature Importance DataFrame
    df_importance = pd.DataFrame({
        "Feature": feature_names,
        "Mean_Abs_SHAP": global_importance
    }).sort_values(by="Mean_Abs_SHAP", ascending=False)
    
    print("\n--- Top 10 Most Influential Features (Global SHAP Importance) ---")
    print(df_importance.head(10).to_string(index=False))
    df_importance.to_csv(os.path.join(REPORTS_DIR, "shap_feature_importance.csv"), index=False)
    
    # Figure 1: Global Feature Importance Bar Chart
    fig, ax = plt.subplots(figsize=(10, 8))
    top_15 = df_importance.head(15).iloc[::-1]
    ax.barh(top_15["Feature"], top_15["Mean_Abs_SHAP"], color="#1f77b4", edgecolor="black", alpha=0.85)
    ax.set_title("Top 15 Global Feature Importances (Mean |SHAP Value| Across All Fault Classes)", fontsize=12, fontweight="bold", pad=12)
    ax.set_xlabel("Mean Absolute SHAP Value (Impact on Model Log-Odds)", fontsize=10, fontweight="bold")
    ax.grid(axis="x", linestyle="--", alpha=0.6)
    for i, v in enumerate(top_15["Mean_Abs_SHAP"]):
        ax.text(v + 0.01, i, f"{v:.3f}", va="center", fontsize=8, fontweight="bold")
    plt.tight_layout()
    p_bar = os.path.join(FIGURES_DIR, "shap_feature_importance_bar.png")
    fig.savefig(p_bar, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Generated: {p_bar}")
    
    # Figure 2: SHAP Multiclass Stacked Summary Plot
    fig, ax = plt.subplots(figsize=(12, 8))
    if mean_abs_per_class is not None:
        # Stacked bar chart for top 12 features across classes
        top_12_indices = np.argsort(global_importance)[-12:]
        top_12_names = [feature_names[i] for i in top_12_indices]
        
        class_colors = ["#2ca02c", "#d62728", "#1f77b4", "#ff7f0e", "#9467bd", "#8c564b"]
        bottom = np.zeros(12)
        
        for c_idx in range(len(CLASS_NAMES)):
            class_vals = mean_abs_per_class[c_idx][top_12_indices]
            ax.barh(top_12_names, class_vals, left=bottom, label=CLASS_NAMES[c_idx], color=class_colors[c_idx], alpha=0.85, edgecolor="black", linewidth=0.5)
            bottom += class_vals
            
        ax.set_title("SHAP Feature Importance Decomposed by Fault Class", fontsize=13, fontweight="bold", pad=12)
        ax.set_xlabel("Mean |SHAP Value| Contribution", fontsize=10, fontweight="bold")
        ax.legend(title="Target Fault Category", loc="lower right", frameon=True, fontsize=9)
        ax.grid(axis="x", linestyle="--", alpha=0.6)
        plt.tight_layout()
        p_summary = os.path.join(FIGURES_DIR, "shap_summary_plot.png")
        fig.savefig(p_summary, dpi=300, bbox_inches="tight")
        plt.close(fig)
        print(f"Generated: {p_summary}")
        
    # Figure 3: Individual Sample Explanation for Selected Classes
    # Explain why a sample was classified into each specific fault type
    sample_explanations = []
    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    axes = axes.flatten()
    
    for c_idx in range(6):
        c_name = CLASS_NAMES[c_idx]
        ax = axes[c_idx]
        
        # Find a test sample whose true class is c_idx
        match_idx = np.where(y_sample == c_idx)[0]
        if len(match_idx) > 0:
            sample_pos = match_idx[0]
            if isinstance(shap_values, list):
                sample_shap = shap_values[c_idx][sample_pos]
            elif len(shap_values.shape) == 3:
                sample_shap = shap_values[sample_pos, :, c_idx]
            else:
                sample_shap = shap_values[sample_pos]
                
            # Top 6 features pushing toward this class
            top_feat_idx = np.argsort(np.abs(sample_shap))[-6:]
            feats = [feature_names[i] for i in top_feat_idx]
            vals = sample_shap[top_feat_idx]
            colors = ["#2ca02c" if v > 0 else "#d62728" for v in vals]
            
            ax.barh(feats, vals, color=colors, edgecolor="black", alpha=0.85)
            ax.axvline(0, color="black", linestyle="-", linewidth=0.8)
            ax.set_title(f"Diagnostic Rationale: {c_name} (Sample #{sample_indices[sample_pos]})", fontsize=10, fontweight="bold")
            ax.set_xlabel("SHAP Impact (+ Favors, - Opposes)", fontsize=8)
            ax.tick_params(axis="y", labelsize=8)
            
            sample_explanations.append({
                "fault_class": c_name,
                "sample_id": int(sample_indices[sample_pos]),
                "top_positive_features": [feature_names[i] for i in top_feat_idx if sample_shap[i] > 0],
                "top_negative_features": [feature_names[i] for i in top_feat_idx if sample_shap[i] < 0]
            })
            
    plt.suptitle("Local Instance Explanations: Key Parameters Driving Individual Fault Diagnoses", fontsize=14, fontweight="bold", y=1.01)
    plt.tight_layout()
    p_local = os.path.join(FIGURES_DIR, "shap_individual_sample_explanations.png")
    fig.savefig(p_local, dpi=300, bbox_inches="tight")
    plt.close(fig)
    print(f"Generated: {p_local}")
    
    with open(os.path.join(REPORTS_DIR, "sample_shap_explanations.json"), "w") as f:
        json.dump(sample_explanations, f, indent=2)
        
    print("Explainable AI pipeline completed successfully.")
    return df_importance


if __name__ == "__main__":
    run_explainability_pipeline()

