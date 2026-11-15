"""
src/data_loader.py
Module for loading, validating, and splitting the VLSI Fault Detection Dataset.
Guarantees clean separation of features, targets, and leakage prevention.
"""

import os
from typing import Tuple, Dict, Any, List
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split

FAULT_CLASS_MAP = {
    0: "No Fault",
    1: "Thermal Fault",
    2: "Timing Fault",
    3: "Power Fault",
    4: "Signal Integrity Fault",
    5: "Reliability Fault"
}

FAULT_CODE_MAP = {v: k for k, v in FAULT_CLASS_MAP.items()}

# Core physical input measurements available at operational diagnosis time
BASE_NUMERICAL_FEATURES = [
    "voltage",
    "frequency",
    "switching_activity",
    "load_capacitance",
    "process_variation",
    "aging_factor",
    "ambient_temp",
    "workload",
    "cooling_efficiency",
    "noise_margin",
    "total_power",
    "junction_temperature",
    "signal_delay",
    "si_margin",
    "electromigration_risk",
    "soft_error_rate",
    "mttf"
]

CATEGORICAL_FEATURES = ["tech_node"]

# Columns that represent target variables or pre-baked leakage
LEAKAGE_COLUMNS = [
    "fault_type",
    "severity",
    "mitigation_action",
    "tech_node_encoded"
]


def find_dataset_path(custom_path: str = None) -> str:
    """Finds the dataset path across typical repository layouts."""
    if custom_path and os.path.exists(custom_path):
        return custom_path
    
    candidates = [
        os.path.join("Data", "vlsi_fault_detection.csv"),
        os.path.join("data", "vlsi_fault_detection.csv"),
        os.path.join("..", "Data", "vlsi_fault_detection.csv"),
        os.path.join("..", "data", "vlsi_fault_detection.csv"),
        os.path.join(os.path.dirname(__file__), "..", "Data", "vlsi_fault_detection.csv"),
        os.path.join(os.path.dirname(__file__), "..", "data", "vlsi_fault_detection.csv"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return os.path.abspath(path)
            
    raise FileNotFoundError(
        "Could not locate 'vlsi_fault_detection.csv'. Please ensure the dataset "
        "is placed in the Data/ or data/ directory."
    )


def load_raw_data(filepath: str = None) -> pd.DataFrame:
    """Loads the raw VLSI dataset from CSV."""
    path = find_dataset_path(filepath)
    df = pd.read_csv(path)
    return df


def inspect_data(df: pd.DataFrame) -> Dict[str, Any]:
    """Inspects dataset dimensions, types, missing values, duplicates, and class counts."""
    action_cols = [c for c in df.columns if c.startswith("action_")]
    info = {
        "shape": df.shape,
        "n_rows": df.shape[0],
        "n_cols": df.shape[1],
        "missing_values": int(df.isnull().sum().sum()),
        "duplicates": int(df.duplicated().sum()),
        "fault_type_counts": df["fault_type"].value_counts().to_dict(),
        "severity_counts": df["severity"].value_counts().to_dict() if "severity" in df.columns else {},
        "mitigation_counts": df["mitigation_action"].value_counts().to_dict() if "mitigation_action" in df.columns else {},
        "tech_nodes": df["tech_node"].value_counts().to_dict() if "tech_node" in df.columns else {},
        "leakage_columns_identified": [c for c in df.columns if c in LEAKAGE_COLUMNS or c.startswith("action_")]
    }
    return info


def get_feature_target_split(
    df: pd.DataFrame, 
    include_engineered: bool = False
) -> Tuple[pd.DataFrame, pd.Series, Dict[str, pd.Series]]:
    """
    Extracts features X and target y, strictly preventing target leakage.
    Returns:
        X: Feature dataframe (operational measurements + tech_node)
        y: Primary fault_type series (0-5)
        meta: Auxiliary dictionary containing 'severity' and 'mitigation_action' for secondary tasks.
    """
    leakage_cols = [c for c in df.columns if c in LEAKAGE_COLUMNS or c.startswith("action_")]
    feature_cols = [c for c in df.columns if c not in leakage_cols]
    
    X = df[feature_cols].copy()
    y = df["fault_type"].copy()
    
    meta = {}
    if "severity" in df.columns:
        meta["severity"] = df["severity"].copy()
    if "mitigation_action" in df.columns:
        meta["mitigation_action"] = df["mitigation_action"].copy()
        
    return X, y, meta


def get_train_val_test_split(
    X: pd.DataFrame, 
    y: pd.Series, 
    meta: Dict[str, pd.Series] = None,
    train_size: float = 0.70,
    val_size: float = 0.15,
    test_size: float = 0.15,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Performs stratified splitting into 70% train, 15% validation, and 15% test sets.
    """
    assert np.isclose(train_size + val_size + test_size, 1.0), "Splits must sum to 1.0"
    
    # First split: Train vs Temp (Val + Test)
    temp_ratio = val_size + test_size
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y, test_size=temp_ratio, random_state=random_state, stratify=y
    )
    
    # Second split: Validation vs Test (half of temp_ratio if 15% and 15%)
    val_test_ratio = test_size / temp_ratio
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp, test_size=val_test_ratio, random_state=random_state, stratify=y_temp
    )
    
    splits = {
        "X_train": X_train,
        "y_train": y_train,
        "X_val": X_val,
        "y_val": y_val,
        "X_test": X_test,
        "y_test": y_test,
    }
    
    # Split meta series if provided
    if meta:
        splits["meta_train"] = {}
        splits["meta_val"] = {}
        splits["meta_test"] = {}
        for k, v in meta.items():
            splits["meta_train"][k] = v.loc[X_train.index]
            splits["meta_val"][k] = v.loc[X_val.index]
            splits["meta_test"][k] = v.loc[X_test.index]
            
    return splits


if __name__ == "__main__":
    df = load_raw_data()
    info = inspect_data(df)
    print("Dataset successfully loaded. Inspection summary:")
    print(f"Total Rows: {info['n_rows']}, Total Cols: {info['n_cols']}")
    print(f"Missing Values: {info['missing_values']}, Duplicates: {info['duplicates']}")
    print(f"Fault Type Distribution: {info['fault_type_counts']}")
    X, y, meta = get_feature_target_split(df)
    print(f"Clean Features X shape: {X.shape}, Target y shape: {y.shape}")
    splits = get_train_val_test_split(X, y, meta)
    print(f"Train samples: {len(splits['X_train'])}, Val samples: {len(splits['X_val'])}, Test samples: {len(splits['X_test'])}")

