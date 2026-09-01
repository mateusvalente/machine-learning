import pandas as pd
import random

def generate_data(num_samples=10000):
    data = []
    
    for _ in range(num_samples):
        is_hacker = random.random() < 0.35 # 35% das linhas serão ataques
        
        if not is_hacker:
            # Padrões de requisições NORMAIS
            is_post_put = random.choice([0, 1])
            query_length = random.randint(0, 50)
            body_length = random.randint(0, 1000) if is_post_put else 0
            special_chars_query = random.randint(0, 2)
            special_chars_body = random.randint(0, 10) if body_length > 0 else 0
            has_sql = 0
            has_xss = 0
            is_standard_browser = 1 if random.random() < 0.95 else 0 # Maioria usa browser real
            request_rate = random.randint(1, 25)
            label = 0
            
        else:
            # Padrões de requisições HACKER (Variações de ataques)
            attack_type = random.choice(["sqli", "xss", "dos", "bot"])
            is_post_put = random.choice([0, 1])
            is_standard_browser = 1 if random.random() < 0.5 else 0
            
            if attack_type == "sqli":
                has_sql = 1
                has_xss = 0
                query_length = random.randint(20, 150)
                body_length = random.randint(50, 500) if is_post_put else 0
                special_chars_query = random.randint(5, 15)
                special_chars_body = random.randint(5, 20) if body_length > 0 else 0
                request_rate = random.randint(5, 40)
                
            elif attack_type == "xss":
                has_sql = 0
                has_xss = 1
                query_length = random.randint(30, 200)
                body_length = random.randint(50, 800) if is_post_put else 0
                special_chars_query = random.randint(8, 25)
                special_chars_body = random.randint(10, 40) if body_length > 0 else 0
                request_rate = random.randint(5, 40)
                
            elif attack_type == "dos":
                has_sql = 0
                has_xss = 0
                query_length = random.randint(0, 20)
                body_length = 0
                special_chars_query = random.randint(0, 2)
                special_chars_body = 0
                request_rate = random.randint(150, 800) # Alta taxa de disparo
                
            elif attack_type == "bot":
                has_sql = 0
                has_xss = 0
                is_standard_browser = 0 # Falso/Nulo User-Agent
                query_length = random.randint(0, 50)
                body_length = random.randint(0, 200) if is_post_put else 0
                special_chars_query = random.randint(0, 5)
                special_chars_body = random.randint(0, 10) if body_length > 0 else 0
                request_rate = random.randint(50, 150)
                
            label = 1
            
        data.append([
            is_post_put, query_length, body_length, special_chars_query, 
            special_chars_body, has_sql, has_xss, is_standard_browser, 
            request_rate, label
        ])
                     
    df = pd.DataFrame(data, columns=[
        "is_post_put", "query_length", "body_length", "special_chars_query",
        "special_chars_body", "has_sql_keywords", "has_xss_keywords",
        "is_standard_browser", "request_rate", "label"
    ])
    
    # Salvar em Excel
    df.to_excel("requisicoes_waf_mlp.xlsx", index=False)
    print(f"Dataset Excel gerado com {num_samples} linhas com sucesso!")

if __name__ == "__main__":
    generate_data()
