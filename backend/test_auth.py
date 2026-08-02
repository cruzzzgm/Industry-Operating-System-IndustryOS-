#!/usr/bin/env python3
"""
Script para testar endpoints de autenticação
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_register():
    print("\n=== TESTE: REGISTER ===")
    url = f"{BASE_URL}/auth/register"
    # Usar timestamp para garantir username único
    import time
    timestamp = str(int(time.time()))
    data = {
        "username": f"testuser{timestamp}",
        "email": f"test{timestamp}@example.com",
        "password": "pass123",
        "full_name": "Test User"
    }
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 201:
            return True
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_login():
    print("\n=== TESTE: LOGIN ===")
    url = f"{BASE_URL}/auth/login"
    data = {
        "username": "testuser",
        "password": "pass123"
    }
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            try:
                return response.json().get("access_token")
            except:
                return None
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_refresh(token):
    print("\n=== TESTE: REFRESH ===")
    url = f"{BASE_URL}/auth/refresh"
    headers = {"Authorization": f"Bearer {token}"}
    try:
        response = requests.post(url, headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("=== TESTANDO ENDPOINTS DE AUTENTICAÇÃO ===")
    
    # Testar register
    register_ok = test_register()
    
    # Testar login
    token = test_login()
    
    # Testar refresh se login funcionou
    if token:
        refresh_ok = test_refresh(token)
    else:
        refresh_ok = False
    
    print("\n=== RESUMO ===")
    print(f"Register: {'✓ OK' if register_ok else '✗ FAILED'}")
    print(f"Login: {'✓ OK' if token else '✗ FAILED'}")
    print(f"Refresh: {'✓ OK' if refresh_ok else '✗ FAILED'}")
