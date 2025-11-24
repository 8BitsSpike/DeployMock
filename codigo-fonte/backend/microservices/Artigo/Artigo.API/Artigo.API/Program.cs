using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Artigo.API.GraphQL.DataLoaders;
using Artigo.API.GraphQL.ErrorFilters;
using Artigo.API.GraphQL.Mutations;
using Artigo.API.GraphQL.Queries;
using Artigo.API.GraphQL.Types;
using Artigo.DbContext.Data;
using Artigo.DbContext.Mappers;
using Artigo.DbContext.Repositories;
using Artigo.Intf.Enums;
using Artigo.Intf.Interfaces;
using Artigo.Server.Mappers;
using Artigo.Server.Services;
using HotChocolate.Data.MongoDb;
using MongoDB.Driver;
using Artigo.API.GraphQL.Inputs;
using Microsoft.AspNetCore.Authentication;
using Artigo.API.Security;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt; // Required for JwtSecurityTokenHandler

var builder = WebApplication.CreateBuilder(args);

var _myAllowSpecificOrigins = "https://revista-v2v5.onrender.com/";

// =========================================================================
// 1. CONFIGURAÇÃO DO MONGODB
// =========================================================================

builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var connectionString = builder.Configuration.GetConnectionString("MongoDb")
        ?? "mongodb://localhost:27017/";
    return new MongoClient(connectionString);
});

builder.Services.AddSingleton<Artigo.DbContext.Interfaces.IMongoDbContext>(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    var databaseName = builder.Configuration["MongoDb:DatabaseName"] ?? "RBEB";
    return new MongoDbContext(client, databaseName);
});

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();


// =========================================================================
// 2. INJEÇÃO DE DEPENDÊNCIA
// =========================================================================

builder.Services.AddScoped<IArtigoRepository, ArtigoRepository>();
builder.Services.AddScoped<IAutorRepository, AutorRepository>();
builder.Services.AddScoped<IEditorialRepository, EditorialRepository>();
builder.Services.AddScoped<IArtigoHistoryRepository, ArtigoHistoryRepository>();
builder.Services.AddScoped<IInteractionRepository, InteractionRepository>();
builder.Services.AddScoped<IPendingRepository, PendingRepository>();
builder.Services.AddScoped<IStaffRepository, StaffRepository>();
builder.Services.AddScoped<IVolumeRepository, VolumeRepository>();

builder.Services.AddScoped<IArtigoService, ArtigoService>();

// Classes de Backing para GraphQL
builder.Services.AddScoped<ArtigoQueries>();
builder.Services.AddScoped<ArtigoMutation>();

// Injeção do Claims Transformer
builder.Services.AddScoped<IClaimsTransformation, StaffClaimsTransformer>();


// =========================================================================
// 3. CONFIGURAÇÃO DO AUTOMAPPER
// =========================================================================

builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<PersistenceMappingProfile>();
    cfg.AddProfile<ArtigoMappingProfile>();
});

// =========================================================================
// 4. CONFIGURAÇÃO DO HOT CHOCOLATE (GRAPHQL)
// =========================================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(name: _myAllowSpecificOrigins,
                      policy =>
                      {
                          policy.WithOrigins("http://localhost:3000")
                                .AllowAnyHeader()
                                .AllowAnyMethod();
                      });
});

builder.Services
    .AddGraphQLServer()
    .AddQueryType<ArtigoQueryType>()
    .AddMutationType<ArtigoMutationType>()

    // Filtros
    .AddErrorFilter<AuthorizationErrorFilter>()
    .AddErrorFilter<ApplicationErrorFilter>()

    // Types (Inputs)
    .AddType<CreateArtigoInput>()
    .AddType<AutorInputType>()
    .AddType<MidiaEntryInputType>()
    .AddType<CreateStaffInput>()
    .AddType<CreateVolumeInputType>()
    .AddType<EditorialTeamInputType>()
    .AddType<UpdateArtigoInput>()
    .AddType<UpdateStaffInputType>()
    .AddType<UpdateVolumeMetadataInputType>()
    .AddType<MidiaEntryEntityInputType>()

    // Types (Objetos de Saída)
    .AddType<ArtigoType>()
    .AddType<AutorType>()
    .AddType<ContribuicaoEditorialType>()
    .AddType<EditorialType>()
    .AddType<EditorialTeamType>()
    .AddType<ArtigoHistoryType>()
    .AddType<StaffComentarioType>()
    .AddType<InteractionType>()
    .AddType<PendingType>()
    .AddType<StaffType>()
    .AddType<VolumeType>()
    .AddType<ArtigoCardListType>()
    .AddType<AutorCardType>()
    .AddType<AutorTrabalhoDTOType>()
    .AddType<AutorViewType>()
    .AddType<ArtigoViewType>()
    .AddType<InteractionConnectionDTOType>()
    .AddType<ArtigoHistoryViewType>()
    .AddType<VolumeCardType>()
    .AddType<VolumeViewType>()
    .AddType<ArtigoEditorialViewType>()
    .AddType<EditorialViewType>()
    .AddType<ArtigoHistoryEditorialViewType>()
    .AddType<StaffViewDTOType>()

    // DataLoaders
    .AddDataLoader<EditorialDataLoader>()
    .AddDataLoader<VolumeDataLoader>()
    .AddDataLoader<AutorBatchDataLoader>()
    .AddDataLoader<InteractionDataLoader>()
    .AddDataLoader<CurrentHistoryContentDataLoader>()
    .AddDataLoader<ArtigoHistoryGroupedDataLoader>()
    .AddDataLoader<InteractionRepliesDataLoader>()
    .AddDataLoader<Artigo.API.GraphQL.DataLoaders.ArticleInteractionsDataLoader>()
    .AddDataLoader<Artigo.API.GraphQL.DataLoaders.ArtigoGroupedDataLoader>()

    .AddMongoDbProjections()
    .AddMongoDbFiltering()
    .AddMongoDbSorting()
    .ModifyRequestOptions(opt => opt.IncludeExceptionDetails = true); 


// =========================================================================
// 5. CONFIGURAÇÃO DE AUTENTICAÇÃO
// =========================================================================

// FIX NUCLEAR: Um validador que aceita TUDO.
// ATENÇÃO: REMOVA ISSO EM PRODUÇÃO.
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = false,
            ValidateIssuerSigningKey = false,
            RequireSignedTokens = false,
            SignatureValidator = delegate (string token, TokenValidationParameters parameters)
            {
                var jwt = new Microsoft.IdentityModel.JsonWebTokens.JsonWebToken(token);
                return jwt;
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddHttpContextAccessor();
var app = builder.Build();

// =========================================================================
// 6. MIDDLEWARE PIPELINE
// =========================================================================

app.UseCors(_myAllowSpecificOrigins);

app.UseAuthentication();
app.UseAuthorization();

app.MapGraphQL();

app.Run();