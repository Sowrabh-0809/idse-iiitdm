"""
src/preprocessing.py
Preprocessing and feature engineering pipelines for VLSI Fault Diagnosis.
Follows strict data science principles: transforms fit strictly on train split,
and electrical domain knowledge is applied to engineer physically justifiable features.
"""

from typing import Tuple, List, Optional
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
import joblib


class VLSIFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Transforms raw electrical measurements into physically grounded VLSI performance metrics:
    1. Dynamic Power Stress Proxy: V^2 * f
    2. Timing Margin Stress: V / f (low ratio implies severe setup-time pressure)
    3. Thermal Gradient (Delta T): junction_temp - ambient_temp
    4. Thermal Dissipation Proxy: Delta T / (total_power + 1e-5)
    5. Dynamic Switching Metric: switching_activity * load_capacitance * V^2 * f
    6. Signal Integrity Health: si_margin / (noise_margin + 1e-5)
    7. Aging Stress Index: aging_factor * (junction_temperature / 100.0)
    """

    def __init__(self, eps: float = 1e-5):
        self.eps = eps
        self.engineered_feature_names_ = [
            "v2_freq",
            "v_over_freq",
            "delta_temp",
            "thermal_resistance_proxy",
            "dynamic_switching_stress",
            "si_to_noise_ratio",
            "aging_thermal_stress"
        ]

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X_out = X.copy()
        
        # 1. Voltage-Frequency relationships
        if "voltage" in X_out.columns and "frequency" in X_out.columns:
            X_out["v2_freq"] = (X_out["voltage"] ** 2) * X_out["frequency"]
            X_out["v_over_freq"] = X_out["voltage"] / (X_out["frequency"] + self.eps)
        
        # 2. Temperature gradient and heat dissipation
        if "junction_temperature" in X_out.columns and "ambient_temp" in X_out.columns:
            X_out["delta_temp"] = X_out["junction_temperature"] - X_out["ambient_temp"]
            if "total_power" in X_out.columns:
                X_out["thermal_resistance_proxy"] = X_out["delta_temp"] / (X_out["total_power"] + self.eps)
                
        # 3. Dynamic switching power stress (alpha * C * V^2 * f)
        if all(col in X_out.columns for col in ["switching_activity", "load_capacitance", "voltage", "frequency"]):
            X_out["dynamic_switching_stress"] = (
                X_out["switching_activity"] * X_out["load_capacitance"] * (X_out["voltage"] ** 2) * X_out["frequency"]
            )
            
        # 4. Signal integrity ratio
        if "si_margin" in X_out.columns and "noise_margin" in X_out.columns:
            X_out["si_to_noise_ratio"] = X_out["si_margin"] / (X_out["noise_margin"] + self.eps)
            
        # 5. Aging thermal compound stress
        if "aging_factor" in X_out.columns and "junction_temperature" in X_out.columns:
            X_out["aging_thermal_stress"] = X_out["aging_factor"] * (X_out["junction_temperature"] / 100.0)
            
        return X_out


def build_preprocessor(
    numerical_features: List[str], 
    categorical_features: List[str]
) -> ColumnTransformer:
    """
    Constructs a ColumnTransformer that scales numerical measurements
    and one-hot encodes categorical technology nodes.
    """
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numerical_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features)
        ],
        remainder="drop"
    )
    return preprocessor


def get_full_pipeline(
    numerical_features: List[str], 
    categorical_features: List[str],
    classifier: BaseEstimator
) -> Pipeline:
    """
    Creates an end-to-end scikit-learn Pipeline with feature engineering,
    column transformations, and the downstream classifier.
    """
    # Expanded numerical features after engineering
    fe = VLSIFeatureEngineer()
    all_num_features = numerical_features + fe.engineered_feature_names_
    
    preprocessor = build_preprocessor(all_num_features, categorical_features)
    
    pipeline = Pipeline(steps=[
        ("feature_engineer", VLSIFeatureEngineer()),
        ("preprocessor", preprocessor),
        ("classifier", classifier)
    ])
    return pipeline


if __name__ == "__main__":
    from data_loader import load_raw_data, get_feature_target_split, BASE_NUMERICAL_FEATURES, CATEGORICAL_FEATURES
    df = load_raw_data()
    X, y, meta = get_feature_target_split(df)
    
    fe = VLSIFeatureEngineer()
    X_eng = fe.transform(X)
    print(f"Original features: {X.shape[1]}, After engineering: {X_eng.shape[1]}")
    print(f"Engineered features added: {fe.engineered_feature_names_}")
    
    all_num = BASE_NUMERICAL_FEATURES + fe.engineered_feature_names_
    preprocessor = build_preprocessor(all_num, CATEGORICAL_FEATURES)
    X_trans = preprocessor.fit_transform(X_eng)
    print(f"Transformed matrix shape: {X_trans.shape}")

