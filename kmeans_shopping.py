import pandas as pd
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
import os

# Dataset Falso: Clientes do Shopping
dados = {
    'Cliente': ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    'Idade': [20, 22, 24, 55, 60, 58, 21, 25],
    'Gasto_Mensal': [50, 60, 45, 500, 550, 480, 800, 750]
}
df = pd.DataFrame(dados)
print("\n========== ATIVIDADE 1: K-MEANS ==========")
print("--- Tabela Original ---")
print(df)

# Treinando K-Means com K=2
kmeans_2 = KMeans(n_clusters=2, random_state=42, n_init='auto')
df['Grupo_K2'] = kmeans_2.fit_predict(df[['Idade', 'Gasto_Mensal']])

print("\n--- Resultados com K=2 ---")
print(df[['Cliente', 'Idade', 'Gasto_Mensal', 'Grupo_K2']])

# Treinando K-Means com K=3 para lidar com a Anomalia (Outlier)
kmeans_3 = KMeans(n_clusters=3, random_state=42, n_init='auto')
df['Grupo_K3'] = kmeans_3.fit_predict(df[['Idade', 'Gasto_Mensal']])

print("\n--- Resultados com K=3 (O Terceiro Grupo 'Jovens que gastam muito' Aparece!) ---")
print(df[['Cliente', 'Idade', 'Gasto_Mensal', 'Grupo_K3']])

# Gerando o gráfico e salvando na mesma pasta
plt.figure(figsize=(8, 6))
plt.scatter(df['Idade'], df['Gasto_Mensal'], c=df['Grupo_K3'], cmap='viridis', s=150, alpha=0.8)
plt.title('Segmentação de Clientes no Shopping (K=3)')
plt.xlabel('Idade')
plt.ylabel('Gasto Mensal (R$)')
plt.grid(True)
for i, txt in enumerate(df['Cliente']):
    plt.annotate(txt, (df['Idade'][i]+0.5, df['Gasto_Mensal'][i]+10))

output_img = os.path.join(os.path.dirname(__file__), 'kmeans_plot.png')
plt.savefig(output_img)
print(f"\n✅ Gráfico gerado com sucesso: {output_img}")
print("==========================================\n")
