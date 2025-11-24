# Imagem base
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1. Copia os arquivos de projeto (csproj)
# Nota: Como este Dockerfile deve estar na raiz da solução, removemos o "../"
# e acessamos as pastas diretamente.
COPY ["Usuario.API/UsuarioAPI.csproj", "Usuario.API/"]
COPY ["Usuario.DbContext/UsuarioDbContext.csproj", "Usuario.DbContext/"]
COPY ["Usuario.Intf/UsuarioIntf.csproj", "Usuario.Intf/"]
COPY ["Usuario.Server/UsuarioServer.csproj", "Usuario.Server/"]

# 2. Restaura as dependências
RUN dotnet restore "Usuario.API/UsuarioAPI.csproj"

# 3. Copia todo o resto do código fonte
COPY . .

# 4. Compila e Publica
WORKDIR "/src/Usuario.API"
RUN dotnet publish "UsuarioAPI.csproj" -c Release -o /app/publish

# 5. Imagem Final
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "UsuarioAPI.dll"]