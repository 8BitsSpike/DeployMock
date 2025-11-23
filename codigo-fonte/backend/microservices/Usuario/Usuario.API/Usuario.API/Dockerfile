# Imagem base .NET 9
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1. Copia TUDO da raiz do repositório para dentro do container
COPY . .

# 2. Restaura
# ATENÇÃO: Verifique se este caminho está exato no seu Git. 
# Se o .csproj estiver em "Usuario/Usuario.API/Usuario.API.csproj", mantenha assim.
# Caso contrário, ajuste o caminho abaixo.
RUN dotnet restore "Usuario.API/Usuario.API/Usuario.API.csproj"

# 3. Compila e Publica
# Entra na pasta onde está o csproj para fazer o publish
WORKDIR "/src/Usuario.API/Usuario.API"
RUN dotnet publish "Usuario.API.csproj" -c Release -o /app/publish

# 4. Imagem Final
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

# Render ignora o EXPOSE, mas deixamos para documentação
EXPOSE 8080

# Esta variável é CRUCIAL. Diz ao .NET para rodar na porta 8080 e aceitar conexões externas
ENV ASPNETCORE_URLS=http://0.0.0.0:8080

ENTRYPOINT ["dotnet", "Usuario.API.dll"]
```

---

### 2. A Configuração no Dashboard do Render (O Pulo do Gato)

O erro mais comum não é no código, é aqui. Quando você criar o **Web Service** no Render, preencha assim:

1.  **Root Directory (Diretório Raiz):** Deixe em branco (ou `.`) se o Dockerfile estiver na raiz do repositório.
    * *Se o Dockerfile estiver dentro de uma pasta (ex: `src/Usuario`), você deve colocar `src/Usuario` aqui.*
2.  **Environment Variables (Variáveis de Ambiente):**
    * Adicione uma variável chamada `PORT` com valor `8080`.
    * O Render usa essa variável para saber quando seu site está "pronto". Como forçamos o .NET a usar a 8080 no Dockerfile, elas precisam bater.

### Resumo do Check-list de Caminhos
Olhe para o seu `RUN dotnet restore ...`. No seu código está:
`"Usuario.API/Usuario.API/Usuario.API.csproj"`

Isso significa que sua estrutura de pastas no Git deve ser exatemente assim:
```text
(Raiz do Git)
 ├── Dockerfile
 └── Usuario.API/
      └── Usuario.API/
           └── Usuario.API.csproj