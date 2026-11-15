"""
src/evaluate.py
Final evaluation, benchmark comparison, and in-depth error analysis on the held-out TEST set (N=4,500).
Generates:
1. Model comparison table (Accuracy, Precision, Recall, Macro F1, Weighted F1).
2. Confusion matrix plots for all models.
3. Detailed classification reports (per-class metrics).
4. Error analysis investigation on misclassified circuit samples.
5. High-resolution figures saved to reports/figures/.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report
)

from data_loader import FAULT_CLASS_MAP

MODEL_DIR = "models"
REPORTS_DIR = "reports"
FIGURES_DIR = os.path.join(REPORTS_DIR, "figures")
os.makedirs(FIGURES_DIR, exist_ok=True)

CLASS_NAMES = [FAULT_CLASS_MAP[i] for i in range(6)]


def load_artifacts():
    """Loads saved splits, preprocessors, and models."""
    splits = joblib.load(os.path.join(MODEL_DIR, "data_splits.joblib"))
    fe = joblib.load(os.path.join(MODEL_DIR, "feature_engineer.joblib"))
    preprocessor = joblib.load(os.path.join(MODEL_DIR, "preprocessor.joblib"))
    
    models = {
        "Dummy Baseline": joblib.load(os.path.join(MODEL_DIR, "dummy_classifier.joblib")),
        "Logistic Regression": joblib.load(os.path.join(MODEL_DIR, "logistic_regression.joblib")),
        "Random Forest": joblib.load(os.path.join(MODEL_DIR, "random_forest.joblib")),
        "XGBoost": joblib.load(os.path.join(MODEL_DIR, "xgboost.joblib")),
    }
    
    with open(os.path.join(MODEL_DIR, "feature_names.json"), "r") as f:
        feature_names = json.load(f)
        
    return splits, fe, preprocessor, models, feature_names


def plot_confusion_matrices(conf_matrices: dict) -> str:
    """Plots a 2x2 grid of confusion matrices for all evaluated models."""
    fig, axes = plt.subplots(2, 2, figsize=(16, 13))
    axes = axes.flatten()
    
    for idx, (name, cm) in enumerate(conf_matrices.items()):
        ax = axes[idx]
        sns.heatmap(
            cm, annot=True, fmt="d", cmap="Blues", cbar=False,
            xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES,
            annot_kws={"size": 9, "fontweight": "bold"}, ax=ax
        )
        ax.set_title(f"Confusion Matrix: {name}", fontsize=12, fontweight="bold", pad=10)
        ax.set_xlabel("Predicted Fault Class", fontsize=10, fontweight="bold")
        ax.set_ylabel("True Fault Class", fontsize=10, fontweight="bold")
        ax.tick_params(axis="x", rotation=30)
        ax.tick_params(axis="y", rotation=0)
        
    plt.suptitle("Evaluation on Held-Out Test Set (N=4,500 Samples)", fontsize=15, fontweight="bold", y=1.01)
    plt.tight_layout()
    out_path = os.path.join(FIGURES_DIR, "all_models_confusion_matrices.png")
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    return out_path


def plot_model_comparison_bar(df_comparison: pd.DataFrame) -> str:
    """Plots a grouped bar chart comparing key evaluation metrics across models."""
    fig, ax = plt.subplots(figsize=(10, 6))
    metrics_to_plot = ["Accuracy", "Macro Precision", "Macro Recall", "Macro F1", "Weighted F1"]
    
    df_plot = df_comparison.set_index("Model")[metrics_to_plot] * 100
    df_plot.plot(kind="bar", ax=ax, colormap="viridis", width=0.75, edgecolor="black", alpha=0.85)
    
    ax.set_title("VLSI Fault Classification Model Benchmark on Test Set", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Model Architecture", fontsize=11, fontweight="bold")
    ax.set_ylabel("Performance (%)", fontsize=11, fontweight="bold")
    ax.set_ylim(0, 115)
    plt.xticks(rotation=15, ha="right", fontsize=10, fontweight="bold")
    ax.legend(title="Metric", loc="upper left", frameon=True, fontsize=9)
    ax.grid(axis="y", linestyle="--", alpha=0.6)
    
    for p in ax.patches:
        h = p.get_height()
        if h > 5:
            ax.annotate(f"{h:.1f}%", (p.get_x() + p.get_width() / 2., h + 1.5),
                        ha="center", va="bottom", fontsize=7, rotation=90)
            
    plt.tight_layout()
    out_path = os.path.join(FIGURES_DIR, "model_performance_comparison.png")
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    return out_path


def perform_error_analysis(
    best_model_name: str, 
    y_test: np.ndarray, 
    y_pred: np.ndarray, 
    X_test_raw: pd.DataFrame
):
    """
    Detailed physical and statistical error analysis:
    - Identifies misclassified instances.
    - Inspects which electrical parameters caused boundary ambiguity.
    - Compares misclassified feature distributions against correct classifications.
    """
    is_correct = (y_test == y_pred)
    misclassified_mask = ~is_correct
    n_errors = int(np.sum(misclassified_mask))
    total_test = len(y_test)
    error_rate = (n_errors / total_test) * 100
    
    print(f"\n========================================================")
    print(f"ERROR ANALYSIS FOR BEST MODEL: {best_model_name}")
    print(f"========================================================")
    print(f"Total Test Samples: {total_test}")
    print(f"Total Correct: {int(np.sum(is_correct))} ({100 - error_rate:.2f}%)")
    print(f"Total Errors : {n_errors} ({error_rate:.2f}%)")
    
    df_errors = X_test_raw[misclassified_mask].copy()
    df_errors["true_fault"] = [FAULT_CLASS_MAP[y] for y in y_test[misclassified_mask]]
    df_errors["pred_fault"] = [FAULT_CLASS_MAP[y] for y in y_pred[misclassified_mask]]
    
    confusion_pairs = df_errors.groupby(["true_fault", "pred_fault"]).size().reset_index(name="count")
    confusion_pairs = confusion_pairs.sort_values(by="count", ascending=False)
    print("\nMost Frequent Confused Pairs:")
    print(confusion_pairs.to_string(index=False))
    
    # Save error cases to CSV
    df_errors.to_csv(os.path.join(REPORTS_DIR, "misclassified_test_samples.csv"), index=False)
    confusion_pairs.to_csv(os.path.join(REPORTS_DIR, "confused_fault_pairs.csv"), index=False)
    
    # Visualization: Error distribution & Key parameter comparison
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
    
    # Left: Confusion pair counts
    if len(confusion_pairs) > 0:
        labels = [f"{r['true_fault']} -> {r['pred_fault']}" for _, r in confusion_pairs.iterrows()]
        counts = confusion_pairs["count"].values
        ax1.barh(labels, counts, color="#d62728", edgecolor="black", alpha=0.8)
        ax1.set_title(f"Misclassification Pairs (Total N={n_errors})", fontsize=11, fontweight="bold")
        ax1.set_xlabel("Number of Misclassified Samples", fontsize=10, fontweight="bold")
        ax1.invert_yaxis()
        for i, v in enumerate(counts):
            ax1.text(v + 0.3, i, str(v), va="center", fontweight="bold", fontsize=9)
    else:
        ax1.text(0.5, 0.5, "Zero Misclassifications!", ha="center", va="center", fontsize=14)
        ax1.set_title("Zero Misclassifications", fontsize=11, fontweight="bold")
        
    # Right: Parameter boundary check (e.g. Signal Integrity Margin vs Signal Delay)
    df_test_full = X_test_raw.copy()
    df_test_full["Classification"] = np.where(is_correct, "Correct", "Misclassified")
    
    sns.scatterplot(
        x="signal_delay", y="si_margin", hue="Classification", style="Classification",
        data=df_test_full, palette={"Correct": "#1f77b4", "Misclassified": "#d62728"},
        alpha=0.7, s=45, ax=ax2
    )
    ax2.set_title("Boundary Inspection: Signal Delay vs. SI Margin", fontsize=11, fontweight="bold")
    ax2.set_xlabel("Signal Delay (ps/ns)", fontsize=10)
    ax2.set_ylabel("Signal Integrity Margin", fontsize=10)
    ax2.legend(title="Diagnosis Status", loc="upper right")
    
    plt.tight_layout()
    out_path = os.path.join(FIGURES_DIR, "error_analysis_misclassifications.png")
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    return confusion_pairs


def run_evaluation_pipeline():
    print("=" * 70)
    print("VLSI FAULT DIAGNOSIS: TEST SET EVALUATION & BENCHMARKING")
    print("=" * 70)
    
    splits, fe, preprocessor, models, feature_names = load_artifacts()
    X_test_raw = splits["X_test"]
    y_test = splits["y_test"].values
    
    # Transform test set using fitted transformers
    X_test_eng = fe.transform(X_test_raw)
    X_test_trans = preprocessor.transform(X_test_eng)
    
    comparison_records = []
    conf_matrices = {}
    classification_reports_dict = {}
    per_class_dfs = []
    
    best_model_name = None
    best_macro_f1 = -1.0
    best_preds = None
    
    for name, model in models.items():
        preds = model.predict(X_test_trans)
        acc = accuracy_score(y_test, preds)
        prec_macro = precision_score(y_test, preds, average="macro", zero_division=0)
        rec_macro = recall_score(y_test, preds, average="macro", zero_division=0)
        f1_mac = f1_score(y_test, preds, average="macro", zero_division=0)
        f1_wt = f1_score(y_test, preds, average="weighted", zero_division=0)
        
        cm = confusion_matrix(y_test, preds)
        conf_matrices[name] = cm
        
        rep_dict = classification_report(y_test, preds, target_names=CLASS_NAMES, output_dict=True, zero_division=0)
        classification_reports_dict[name] = rep_dict
        
        comparison_records.append({
            "Model": name,
            "Accuracy": acc,
            "Macro Precision": prec_macro,
            "Macro Recall": rec_macro,
            "Macro F1": f1_mac,
            "Weighted F1": f1_wt
        })
        
        # Per-class metrics
        for c_idx, c_name in enumerate(CLASS_NAMES):
            c_rep = rep_dict[c_name]
            per_class_dfs.append({
                "Model": name,
                "Fault Class": c_name,
                "Precision": c_rep["precision"],
                "Recall": c_rep["recall"],
                "F1-Score": c_rep["f1-score"],
                "Support": c_rep["support"]
            })
            
        if f1_mac > best_macro_f1:
            best_macro_f1 = f1_mac
            best_model_name = name
            best_preds = preds
            
    df_comparison = pd.DataFrame(comparison_records)
    df_per_class = pd.DataFrame(per_class_dfs)
    
    print("\n--- Model Benchmark Table on Held-Out Test Set (N=4,500) ---")
    print(df_comparison.to_string(index=False))
    
    # Save CSV tables and JSON reports
    df_comparison.to_csv(os.path.join(REPORTS_DIR, "model_comparison_table.csv"), index=False)
    df_per_class.to_csv(os.path.join(REPORTS_DIR, "per_class_metrics.csv"), index=False)
    with open(os.path.join(REPORTS_DIR, "test_evaluation_reports.json"), "w") as f:
        json.dump(classification_reports_dict, f, indent=2)
        
    # Generate Visualizations
    p_cm = plot_confusion_matrices(conf_matrices)
    print(f"\nGenerated confusion matrices grid: {p_cm}")
    p_bar = plot_model_comparison_bar(df_comparison)
    print(f"Generated comparison chart: {p_bar}")
    
    # Detailed Error Analysis on Best Model
    confusion_pairs = perform_error_analysis(best_model_name, y_test, best_preds, X_test_raw)
    
    print("\nEvaluation pipeline complete. All metrics and figures generated.")
    return df_comparison, df_per_class


if __name__ == "__main__":
    run_evaluation_pipeline()

