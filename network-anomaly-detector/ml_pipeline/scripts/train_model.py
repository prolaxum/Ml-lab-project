import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score
from sklearn.model_selection import train_test_split

# 1. Load the dataset
file_path = "../data/KDDTrain+.txt" 
columns = ['duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes', 'land', 'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in', 'num_compromised', 'root_shell', 'su_attempted', 'num_root', 'num_file_creations', 'num_shells', 'num_access_files', 'num_outbound_cmds', 'is_host_login', 'is_guest_login', 'count', 'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate', 'same_srv_rate', 'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count', 'dst_host_srv_count', 'dst_host_same_srv_rate', 'dst_host_diff_srv_rate', 'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate', 'dst_host_serror_rate', 'dst_host_srv_serror_rate', 'dst_host_rerror_rate', 'dst_host_srv_rerror_rate', 'label', 'difficulty']
data = pd.read_csv(file_path, names=columns)

# 2. Map specific attacks to their real-world threat categories
attack_map = {
    'normal': 'Safe',
    'neptune': 'DoS Attack', 'smurf': 'DoS Attack', 'pod': 'DoS Attack', 'teardrop': 'DoS Attack', 'land': 'DoS Attack', 'back': 'DoS Attack',
    'satan': 'Probe (Scanning)', 'ipsweep': 'Probe (Scanning)', 'nmap': 'Probe (Scanning)', 'portsweep': 'Probe (Scanning)',
    'guess_passwd': 'R2L (Unauthorized Access)', 'ftp_write': 'R2L (Unauthorized Access)', 'imap': 'R2L (Unauthorized Access)', 'phf': 'R2L (Unauthorized Access)', 'multihop': 'R2L (Unauthorized Access)', 'warezmaster': 'R2L (Unauthorized Access)', 'warezclient': 'R2L (Unauthorized Access)', 'spy': 'R2L (Unauthorized Access)',
    'buffer_overflow': 'U2R (Superuser Hijack)', 'loadmodule': 'U2R (Superuser Hijack)', 'perl': 'U2R (Superuser Hijack)', 'rootkit': 'U2R (Superuser Hijack)'
}

# Apply the mapping. If an attack isn't in our dictionary, label it 'Unknown Attack'
data['target_class'] = data['label'].apply(lambda x: attack_map.get(x, 'Unknown Attack'))

# 3. Features
features = ['duration', 'src_bytes', 'dst_bytes', 'count']
X = data[features]
y = data['target_class']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 4. Train the Multiclass Model
print("Training new multiclass model. This might take a few seconds...")
model = RandomForestClassifier(
    n_estimators=250,
    random_state=42,
    class_weight='balanced_subsample',
    min_samples_leaf=1,
    n_jobs=1
)
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
metrics = {
    "accuracy": round(accuracy_score(y_test, y_pred) * 100, 1),
    "precision": round(precision_score(y_test, y_pred, average='weighted', zero_division=0) * 100, 1),
    "recall": round(recall_score(y_test, y_pred, average='weighted', zero_division=0) * 100, 1),
}
print(f"New Model Accuracy: {metrics['accuracy']:.2f}%")

# 5. Save the upgraded brain
joblib.dump(model, 'anomaly_model.pkl')
print("Upgraded model saved successfully!")

metrics_path = Path("model_metrics.json")
metrics_path.write_text(json.dumps(metrics, indent=2))
print(f"Metrics saved to {metrics_path.resolve()}")
