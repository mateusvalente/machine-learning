import pandas as pd
import random
import uuid
import json
from faker import Faker

fake = Faker()

def generate_dataset(num_rows=2500):
    data = []
    
    # Attack payloads
    sqli_payloads = ["' OR 1=1 --", "' UNION SELECT null, username, password FROM users--", "admin' #", "1; DROP TABLE users"]
    xss_payloads = ["<script>alert(1)</script>", "\"><img src=x onerror=prompt(1)>", "javascript:eval('var a=1')"]
    path_traversal = ["../../../etc/passwd", "..%2F..%2Fwindows%2Fwin.ini", "/var/www/html/../../../etc/shadow"]
    
    user_agents_normal = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15"
    ]
    user_agents_bot = [
        "python-requests/2.25.1",
        "curl/7.68.0",
        "sqlmap/1.5.8#dev (http://sqlmap.org)",
        "Nmap Scripting Engine",
        "Nikto/2.1.6"
    ]
    
    countries = ["BR", "US", "RU", "CN", "GB", "IN", "DE", "FR"]
    
    for _ in range(num_rows):
        is_attack = random.random() < 0.4 # 40% das requisições serão suspeitas
        
        # Base attributes
        ip_origem = fake.ipv4()
        metodo = random.choice(["GET", "POST"]) if not is_attack else random.choice(["GET", "POST", "PUT", "DELETE"])
        tls_fingerprint = fake.md5()
        geolocalizacao = random.choice(countries)
        
        if not is_attack:
            # Normal traffic
            label = "normal"
            tipo_ataque = "none"
            url = random.choice(["/home", "/produtos", "/contato", "/login", "/api/pedidos"])
            query_params = ""
            if metodo == "GET" and random.random() < 0.3:
                query_params = f"id={random.randint(1,100)}&ref=promo"
            
            body = ""
            if metodo == "POST":
                body = json.dumps({"username": fake.user_name(), "pass": "******"})
                
            user_agent = random.choice(user_agents_normal)
            cookies = f"session_id={fake.uuid4()}; theme=dark"
            tamanho = random.randint(100, 800)
            taxa_req = random.randint(1, 15)
            reputacao_ip = round(random.uniform(0.7, 1.0), 2)
            historico = random.choice(["established", "new"])
            
        else:
            # Attack traffic
            label = "suspeita"
            attack_type = random.choice(["sqli", "xss", "path_traversal", "dos", "bot"])
            tipo_ataque = attack_type
            
            url = random.choice(["/login", "/search", "/admin", "/api/users"])
            query_params = ""
            body = ""
            user_agent = random.choice(user_agents_normal)
            cookies = f"session_id={fake.uuid4()};"
            tamanho = random.randint(100, 800)
            taxa_req = random.randint(1, 30)
            reputacao_ip = round(random.uniform(0.0, 0.6), 2)
            historico = random.choice(["new", "previously_flagged"])
            
            if attack_type == "sqli":
                if metodo == "GET":
                    query_params = f"user={random.choice(sqli_payloads)}"
                else:
                    body = json.dumps({"username": random.choice(sqli_payloads)})
                tamanho += len(query_params) + len(body)
            elif attack_type == "xss":
                query_params = f"search={random.choice(xss_payloads)}"
                tamanho += len(query_params)
            elif attack_type == "path_traversal":
                url = f"/download?file={random.choice(path_traversal)}"
            elif attack_type == "dos":
                taxa_req = random.randint(100, 5000)
                reputacao_ip = round(random.uniform(0.0, 0.3), 2)
            elif attack_type == "bot":
                user_agent = random.choice(user_agents_bot)
                taxa_req = random.randint(20, 100)
                reputacao_ip = round(random.uniform(0.2, 0.5), 2)
                
        # Headers Extras
        content_type = "application/json" if body else "text/html"
        headers_extras = f"Content-Type: {content_type}; Accept-Language: pt-BR"

        data.append({
            "request_id": str(uuid.uuid4())[:8],
            "ip_origem": ip_origem,
            "url_uri": url,
            "metodo_http": metodo,
            "user_agent": user_agent,
            "headers_extras": headers_extras,
            "query_params": query_params,
            "body": body,
            "cookies": cookies,
            "tamanho_requisicao": tamanho,
            "taxa_requisicoes_1m": taxa_req,
            "tls_fingerprint": tls_fingerprint,
            "geolocalizacao": geolocalizacao,
            "reputacao_ip": reputacao_ip,
            "historico_sessao": historico,
            "label": label,
            "tipo_ataque": tipo_ataque
        })
        
    df = pd.DataFrame(data)
    df.to_csv("requisicoes_waf.csv", index=False)
    print("Dataset rico gerado com sucesso em 'requisicoes_waf.csv'!")

if __name__ == "__main__":
    generate_dataset()
