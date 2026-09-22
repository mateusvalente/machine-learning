import pandas as pd
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)

try:
    from mlxtend.preprocessing import TransactionEncoder
    from mlxtend.frequent_patterns import apriori, association_rules
except ImportError:
    print("Por favor, instale o mlxtend usando: pip install mlxtend")
    exit()

# Dataset Falso: Recibos da Padaria
recibos = [
    ['Pão', 'Manteiga', 'Café'],
    ['Pão', 'Manteiga', 'Bolo'],
    ['Café', 'Leite', 'Biscoito'],
    ['Pão', 'Manteiga', 'Café', 'Leite'],
    ['Pão', 'Queijo']
]

print("\n========== ATIVIDADE 3: APRIORI ==========")
print("--- Transações da Padaria ---")
for i, recibo in enumerate(recibos, 1):
    print(f"Recibo #{i}: {recibo}")

# Transformar listas num formato que o algoritmo entende (Matriz Booleana True/False)
te = TransactionEncoder()
te_ary = te.fit(recibos).transform(recibos)
df = pd.DataFrame(te_ary, columns=te.columns_)

print("\n--- Tabela Preparada para o Algoritmo ---")
print(df)

# 1. Encontrar Itens Frequentes (Aparecem em pelo menos 40% das compras)
frequent_itemsets = apriori(df, min_support=0.4, use_colnames=True)

# 2. Gerar Regras de Associação (Probabilidade de acerto mínima de 60%)
regras = association_rules(frequent_itemsets, metric="confidence", min_threshold=0.6)

print("\n--- Regras de Associação Descobertas! ---")
# Simplificando a visualização da tabela de saída
resultado = pd.DataFrame()
resultado['Comprando (A)'] = regras['antecedents'].apply(lambda x: ', '.join(list(x)))
resultado['Também leva (B)'] = regras['consequents'].apply(lambda x: ', '.join(list(x)))
resultado['Confiança (%)'] = (regras['confidence'] * 100).round(2)

# Ordenando pelas regras mais fortes
resultado = resultado.sort_values(by='Confiança (%)', ascending=False).reset_index(drop=True)

print(resultado.to_string(index=False))

print("\n💡 Conclusão da Atividade:")
print("* Veja que quem compra Manteiga TEM 100% de chance de comprar Pão.")
print("* Por outro lado, de todas as pessoas que compraram Pão (4 pessoas),")
print("  apenas 3 levaram manteiga, resultando em 75% de confiança para 'Pão -> Manteiga'.")
print("==========================================\n")
