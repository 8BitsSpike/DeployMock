# Imagem base
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# 1. Copia os arquivos de projeto (csproj)
# CORREÇÃO: Ajustado para os nomes de arquivo vistos no log (sem o ponto antes da extensão)
# CORREÇÃO CRÍTICA: O destino do DbContext foi alterado para "Usuario.DBContext/" (Maiúsculo)
# para coincidir com o que o Usuario.Server.csproj está procurando.

COPY ["Usuario.API/UsuarioAPI.csproj", "Usuario.API/"]
COPY ["Usuario.DbContext/UsuarioDbContext.csproj", "Usuario.DBContext/"]
COPY ["Usuario.Intf/UsuarioIntf.csproj", "Usuario.Intf/"]
COPY ["Usuario.Server/UsuarioServer.csproj", "Usuario.Server/"]

# 2. Restaura as dependências
# Nota: O restore usa o caminho onde copiamos o arquivo acima
RUN dotnet restore "Usuario.API/UsuarioAPI.csproj"

# 3. Copia todo o resto do código fonte
COPY . .

# 4. Compila e Publica
WORKDIR "/src/Usuario.API"
# Ajustado o nome do arquivo aqui também
RUN dotnet publish "UsuarioAPI.csproj" -c Release -o /app/publish

# 5. Imagem Final
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
# Ajustado o nome da DLL final (geralmente segue o nome do projeto)
ENTRYPOINT ["dotnet", "UsuarioAPI.dll"]