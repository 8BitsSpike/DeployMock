# Imagem base
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1. Copia os arquivos de projeto (csproj)
# Sintaxe simplificada: COPY origem destino
COPY ../Usuario.API/Usuario.API.csproj Usuario.API/
COPY ../Usuario.DbContext/Usuario.DbContext.csproj Usuario.DbContext/
COPY ../Usuario.Intf/Usuario.Intf.csproj Usuario.Intf/
COPY ../Usuario.Server/Usuario.Server.csproj Usuario.Server/

# 2. Restaura as dependências
RUN dotnet restore "Usuario.API/Usuario.API.csproj"

# 3. Copia todo o resto do código fonte
COPY . .

# 4. Compila e Publica
WORKDIR "/src/Usuario.API"
RUN dotnet publish "Usuario.API.csproj" -c Release -o /app/publish

# 5. Imagem Final
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "Usuario.API.dll"]