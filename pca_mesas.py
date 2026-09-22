import pandas as pd
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

# Dataset Falso: Dimensões de Mesas
dados = {
    'Mesa_ID': ['M1', 'M2', 'M3', 'M4', 'M5'],
    'Largura_cm': [100, 110, 90, 200, 210],
    'Comprimento_cm': [100, 115, 95, 200, 215],
    'Area_Total_cm2': [10000, 12650, 8550, 40000, 45150]
}
df = pd.DataFrame(dados)
print("\n========== ATIVIDADE 2: PCA ==========")
print("--- Tabela Original (3 Variáveis Altamente Correlacionadas) ---")
print(df)

# 1. Padronizar os dados (Passo fundamental antes de aplicar o PCA)
features = ['Largura_cm', 'Comprimento_cm', 'Area_Total_cm2']
X = df[features]
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 2. Aplicar o PCA
# Queremos resumir as 3 colunas em apenas 1 Componente Principal
pca = PCA(n_components=1)
X_pca = pca.fit_transform(X_scaled)

# 3. Adicionar o novo Componente à tabela final
df['Fator_Tamanho_Geral (PC1)'] = X_pca.round(2)

print("\n--- Tabela após PCA (Reduzida de 3 para 1 única Variável de Tamanho) ---")
print(df[['Mesa_ID', 'Fator_Tamanho_Geral (PC1)']])

print("\n--- O quanto de informação nós salvamos? ---")
variancia = pca.explained_variance_ratio_[0] * 100
print(f"{variancia:.2f}% dos dados originais foram mantidos nessa única coluna!")
print("Isso prova que as colunas originais eram redundantes (diziam a mesma coisa).")
print("======================================\n")
