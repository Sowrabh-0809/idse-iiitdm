"""
src/eda_visualizer.py
Generates the comprehensive set of Exploratory Data Analysis (EDA) visualizations
for the VLSI Fault Diagnosis project. Saves all 8 required figures in reports/figures/
with professional publication-quality styling.
"""

import os
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Set style
plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
plt.rcParams["font.sans-serif"] = "DejaVu Sans"
plt.rcParams["axes.edgecolor"] = "#cccccc"
plt.rcParams["axes.linewidth"] = 0.8

from data_loader import load_raw_data, get_feature_target_split, FAULT_CLASS_MAP

OUTPUT_DIR = os.path.join("reports", "figures")
os.makedirs(OUTPUT_DIR, exist_ok=True)

CLASS_COLORS = {
    "No Fault": "#2ca02c",
    "Thermal Fault": "#d62728",
    "Timing Fault": "#1f77b4",
    "Power Fault": "#ff7f0e",
    "Signal Integrity Fault": "#9467bd",
    "Reliability Fault": "#8c564b"
}


def plot_fault_class_distribution(df: pd.DataFrame) -> str:
    """1. Fault class distribution bar chart."""
    fig, ax = plt.subplots(figsize=(8, 5))
    counts = df["fault_type"].map(FAULT_CLASS_MAP).value_counts()
    classes = [FAULT_CLASS_MAP[i] for i in range(6)]
    values = [counts[c] for c in classes]
    colors = [CLASS_COLORS[c] for c in classes]
    
    bars = ax.bar(classes, values, color=colors, edgecolor="black", alpha=0.85, width=0.6)
    ax.set_title("VLSI Fault Class Distribution (Exact Balanced Dataset)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Fault Category", fontsize=11, fontweight="bold")
    ax.set_ylabel("Number of Samples", fontsize=11, fontweight="bold")
    ax.set_ylim(0, max(values) * 1.15)
    plt.xticks(rotation=20, ha="right", fontsize=10)
    
    for bar in bars:
        h = bar.get_height()
        pct = (h / len(df)) * 100
        ax.text(bar.get_x() + bar.get_width()/2., h + 70, f"{h:,}\n({pct:.1f}%)", ha="center", va="bottom", fontsize=9, fontweight="bold")
        
    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "fault_class_distribution.png")
    fig.savefig(out_path, dpi=300)
    plt.close(fig)
    return out_path


def plot_numerical_distributions(df: pd.DataFrame) -> str:
    """2. Numerical feature distribution histograms."""
    key_features = [
        "voltage", "frequency", "total_power", 
        "junction_temperature", "signal_delay", "si_margin", 
        "electromigration_risk", "mttf"
    ]
    fig, axes = plt.subplots(2, 4, figsize=(16, 8))
    axes = axes.flatten()
    
    for i, col in enumerate(key_features):
        ax = axes[i]
        sns.histplot(df[col], kde=True, ax=ax, color="#1f77b4", edgecolor="#08306b", bins=30, alpha=0.6)
        ax.set_title(f"Distribution: {col.replace('_', ' ').title()}", fontsize=11, fontweight="bold")
        ax.set_xlabel(col, fontsize=9)
        ax.set_ylabel("Count", fontsize=9)
        
    plt.suptitle("Distributions of Key Physical & Operational Parameters", fontsize=14, fontweight="bold", y=1.02)
    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "numerical_feature_distributions.png")
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    return out_path


def plot_boxplots_against_faults(df: pd.DataFrame) -> str:
    """3. Boxplots of important electrical parameters against fault classes."""
    key_features = ["junction_temperature", "total_power", "signal_delay", "si_margin"]
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    axes = axes.flatten()
    df_copy = df.copy()
    df_copy["fault_name"] = df_copy["fault_type"].map(FAULT_CLASS_MAP)
    order = [FAULT_CLASS_MAP[i] for i in range(6)]
    
    for i, feat in enumerate(key_features):
        ax = axes[i]
        sns.boxplot(x="fault_name", y=feat, data=df_copy, order=order, ax=ax, palette=CLASS_COLORS, hue="fault_name", legend=False, width=0.6, fliersize=2)
        ax.set_title(f"{feat.replace('_', ' ').title()} vs Fault Class", fontsize=11, fontweight="bold")
        ax.set_xlabel("Fault Class", fontsize=10)
        ax.set_ylabel(feat, fontsize=10)
        ax.tick_params(axis="x", rotation=25)
        
    plt.suptitle("Boxplots of Critical Electrical Parameters Across Fault Classes", fontsize=14, fontweight="bold", y=1.01)
    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "boxplots_electrical_parameters.png")
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    return out_path


def plot_correlation_heatmap(df: pd.DataFrame) -> str:
    """4. Correlation heatmap for operational features."""
    from data_loader import BASE_NUMERICAL_FEATURES
    corr = df[BASE_NUMERICAL_FEATURES].corr()
    
    fig, ax = plt.subplots(figsize=(14, 11))
    mask = np.triu(np.ones_like(corr, dtype=bool))
    cmap = sns.diverging_palette(230, 20, as_cmap=True)
    sns.heatmap(corr, mask=mask, cmap=cmap, vmin=-1.0, vmax=1.0, center=0,
                square=True, linewidths=0.5, cbar_kws={"shrink": 0.8},
                annot=True, fmt=".2f", annot_kws={"size": 8}, ax=ax)
    ax.set_title("Pearson Correlation Matrix of VLSI Operational Parameters", fontsize=14, fontweight="bold", pad=15)
    plt.xticks(rotation=45, ha="right", fontsize=9)
    plt.yticks(rotation=0, fontsize=9)
    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "correlation_heatmap.png")
    fig.savefig(out_path, dpi=300)
    plt.close(fig)
    return out_path


def plot_pairplot_selected(df: pd.DataFrame) -> str:
    """5. Pairplot for selected important features."""
    selected_cols = ["voltage", "total_power", "junction_temperature", "si_margin"]
    df_sub = df[selected_cols + ["fault_type"]].sample(n=1200, random_state=42).copy()
    df_sub["Fault Class"] = df_sub["fault_type"].map(FAULT_CLASS_MAP)
    
    g = sns.pairplot(
        df_sub.drop(columns=["fault_type"]),
        hue="Fault Class",
        palette=CLASS_COLORS,
        diag_kind="kde",
        plot_kws={"alpha": 0.5, "s": 25, "edgecolor": "none"},
        height=2.4,
        aspect=1.1
    )
    g.fig.suptitle("Pairwise Relationships Among Diagnostic Signatures (Sampled N=1,200)", fontsize=13, fontweight="bold", y=1.02)
    out_path = os.path.join(OUTPUT_DIR, "pairplot_important_features.png")
    g.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(g.fig)
    return out_path


def plot_junction_temp_analysis(df: pd.DataFrame) -> str:
    """6. Junction temperature versus fault class analysis."""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    df_copy = df.copy()
    df_copy["fault_name"] = df_copy["fault_type"].map(FAULT_CLASS_MAP)
    order = [FAULT_CLASS_MAP[i] for i in range(6)]
    
    # Left: Violin plot showing distribution & density
    sns.violinplot(x="fault_name", y="junction_temperature", data=df_copy, order=order, ax=ax1, palette=CLASS_COLORS, hue="fault_name", legend=False, inner="quartile")
    ax1.axhline(105, color="red", linestyle="--", linewidth=1.5, label="Silicon Safe Limit (105°C)")
    ax1.set_title("Junction Temperature Distribution by Fault Class", fontsize=11, fontweight="bold")
    ax1.set_xlabel("Fault Category", fontsize=10)
    ax1.set_ylabel("Junction Temperature (°C)", fontsize=10)
    ax1.tick_params(axis="x", rotation=25)
    ax1.legend(loc="upper left")
    
    # Right: Ambient vs Junction Temp scatter
    sns.scatterplot(
        x="ambient_temp", y="junction_temperature", hue="fault_name", 
        data=df_copy.sample(n=1500, random_state=42), 
        palette=CLASS_COLORS, alpha=0.6, s=30, ax=ax2
    )
    ax2.axhline(105, color="red", linestyle="--", linewidth=1.2)
    ax2.set_title("Ambient vs. Junction Temperature Scatter", fontsize=11, fontweight="bold")
    ax2.set_xlabel("Ambient Temperature (°C)", fontsize=10)
    ax2.set_ylabel("Junction Temperature (°C)", fontsize=10)
    ax2.legend(title="Fault Class", bbox_to_anchor=(1.02, 1), loc="upper left", fontsize=9)
    
    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "junction_temp_vs_fault_class.png")
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    return out_path


def plot_voltage_vs_frequency(df: pd.DataFrame) -> str:
    """7. Voltage versus frequency analysis."""
    fig, ax = plt.subplots(figsize=(9, 6))
    df_sample = df.sample(n=2000, random_state=42).copy()
    df_sample["Fault Class"] = df_sample["fault_type"].map(FAULT_CLASS_MAP)
    
    sns.scatterplot(
        x="frequency", y="voltage", hue="Fault Class",
        data=df_sample, palette=CLASS_COLORS, alpha=0.7, s=40, edgecolor="none", ax=ax
    )
    
    # Add physical regime guidelines
    ax.axhline(1.10, color="orange", linestyle=":", label="Overvoltage Threshold (1.10V)")
    ax.axhline(0.92, color="blue", linestyle=":", label="Undervoltage Threshold (0.92V)")
    ax.set_title("Operating Frequency (GHz) vs. Supply Voltage (V)", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Frequency (GHz)", fontsize=11, fontweight="bold")
    ax.set_ylabel("Supply Voltage (V)", fontsize=11, fontweight="bold")
    ax.legend(title="Fault Class", bbox_to_anchor=(1.02, 1), loc="upper left", frameon=True)
    
    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "voltage_vs_frequency.png")
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    return out_path


def plot_feature_comparison_across_faults(df: pd.DataFrame) -> str:
    """8. Standardized feature comparison across fault classes."""
    from data_loader import BASE_NUMERICAL_FEATURES
    
    # Standardize features for normalized comparison
    means_raw = df.groupby("fault_type")[BASE_NUMERICAL_FEATURES].mean()
    means_std = (means_raw - df[BASE_NUMERICAL_FEATURES].mean()) / df[BASE_NUMERICAL_FEATURES].std()
    
    fig, ax = plt.subplots(figsize=(15, 7))
    x = np.arange(len(BASE_NUMERICAL_FEATURES))
    width = 0.13
    
    for i in range(6):
        c_name = FAULT_CLASS_MAP[i]
        color = CLASS_COLORS[c_name]
        vals = means_std.loc[i].values
        ax.bar(x + (i - 2.5) * width, vals, width, label=c_name, color=color, alpha=0.85, edgecolor="black", linewidth=0.5)
        
    ax.axhline(0, color="black", linestyle="-", linewidth=0.8)
    ax.set_title("Z-Score Normalized Feature Deviations Across All Six Fault Categories", fontsize=13, fontweight="bold", pad=12)
    ax.set_xlabel("Operational & Electrical Features", fontsize=11, fontweight="bold")
    ax.set_ylabel("Standardized Deviation (Z-score)", fontsize=11, fontweight="bold")
    ax.set_xticks(x)
    ax.set_xticklabels([f.replace("_", "\n") for f in BASE_NUMERICAL_FEATURES], fontsize=8, fontweight="bold")
    ax.legend(title="Fault Class", loc="upper right", frameon=True, fontsize=9)
    ax.grid(axis="y", linestyle="--", alpha=0.6)
    
    plt.tight_layout()
    out_path = os.path.join(OUTPUT_DIR, "feature_comparison_across_faults.png")
    fig.savefig(out_path, dpi=300, bbox_inches="tight")
    plt.close(fig)
    return out_path


def generate_all_eda_plots():
    df = load_raw_data()
    print("Generating comprehensive EDA figures...")
    p1 = plot_fault_class_distribution(df)
    print(f"Generated: {p1}")
    p2 = plot_numerical_distributions(df)
    print(f"Generated: {p2}")
    p3 = plot_boxplots_against_faults(df)
    print(f"Generated: {p3}")
    p4 = plot_correlation_heatmap(df)
    print(f"Generated: {p4}")
    p5 = plot_pairplot_selected(df)
    print(f"Generated: {p5}")
    p6 = plot_junction_temp_analysis(df)
    print(f"Generated: {p6}")
    p7 = plot_voltage_vs_frequency(df)
    print(f"Generated: {p7}")
    p8 = plot_feature_comparison_across_faults(df)
    print(f"Generated: {p8}")
    print("All 8 EDA figures successfully saved to reports/figures/!")


if __name__ == "__main__":
    generate_all_eda_plots()

