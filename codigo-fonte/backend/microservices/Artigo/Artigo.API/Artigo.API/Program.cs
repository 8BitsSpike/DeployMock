using Artigo.API.GraphQL.DataLoaders;
using Artigo.API.GraphQL.ErrorFilters;
using Artigo.API.GraphQL.Inputs;
using Artigo.API.GraphQL.Mutations;
using Artigo.API.GraphQL.Queries;
using Artigo.API.GraphQL.Resolvers;
using Artigo.API.GraphQL.Types;
using Artigo.API.Security;
using Artigo.DbContext.Config;
using Artigo.DbContext.Data;
using Artigo.DbContext.Interfaces;
using Artigo.DbContext.Mappers;
using Artigo.DbContext.Repositories;
using Artigo.Intf.Interfaces;
using Artigo.Server.Mappers;
using Artigo.Server.Services;
using AutoMapper;
using HotChocolate;
using HotChocolate.AspNetCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// =============================================================================
// 1. DATA & INFRASTRUCTURE
// =============================================================================

// MongoDB
builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection("MongoDb"));

builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDBSettings>>().Value;
    return new MongoClient(settings.ConnectionString);
});

builder.Services.AddScoped<Artigo.DbContext.Interfaces.IMongoDbContext>(sp =>
{
    var settings = sp.GetRequiredService<IOptions<MongoDBSettings>>().Value;
    var client = sp.GetRequiredService<IMongoClient>();
    return new MongoDbContext(client, settings.DatabaseName);
});

// AutoMapper
builder.Services.AddSingleton<IMapper>(sp =>
{
    var config = new MapperConfiguration(cfg =>
    {
        cfg.AddProfile<PersistenceMappingProfile>();
        cfg.AddProfile<ArtigoMappingProfile>();
    });
    return config.CreateMapper();
});

// Repositories & UoW
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IArtigoRepository, ArtigoRepository>();
builder.Services.AddScoped<IEditorialRepository, EditorialRepository>();
builder.Services.AddScoped<IArtigoHistoryRepository, ArtigoHistoryRepository>();
builder.Services.AddScoped<IAutorRepository, AutorRepository>();
builder.Services.AddScoped<IStaffRepository, StaffRepository>();
builder.Services.AddScoped<IVolumeRepository, VolumeRepository>();
builder.Services.AddScoped<IPendingRepository, PendingRepository>();
builder.Services.AddScoped<IInteractionRepository, InteractionRepository>();

// Services
builder.Services.AddScoped<IArtigoService, ArtigoService>();
builder.Services.AddHttpContextAccessor();

// =============================================================================
// 2. SECURITY (AUTH & CORS)
// =============================================================================

var jwtKey = builder.Configuration["Key"];
if (string.IsNullOrEmpty(jwtKey))
{
    // Fallback manual para garantir que não quebre se o appsettings falhar
    jwtKey = "ThisIsAVeryLongAndSecureKeyForTestingPurposesThatIsAtLeast32BytesLong";
}
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            NameClaimType = ClaimTypes.NameIdentifier
        };
    });

builder.Services.AddTransient<IClaimsTransformation, StaffClaimsTransformer>();
builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("MagazinePolicy", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "https://revista-v2v5.onrender.com"
              )
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// =============================================================================
// 3. GRAPHQL CONFIGURATION
// =============================================================================

builder.Services
    .AddGraphQLServer()

    .AddErrorFilter<AuthorizationErrorFilter>()
    .AddErrorFilter<ApplicationErrorFilter>()
    // DataLoaders
    .AddDataLoader<ArtigoGroupedDataLoader>()
    .AddDataLoader<AutorBatchDataLoader>()
    .AddDataLoader<EditorialDataLoader>()
    .AddDataLoader<VolumeDataLoader>()
    .AddDataLoader<ArtigoHistoryGroupedDataLoader>()
    .AddDataLoader<CurrentHistoryContentDataLoader>()
    .AddDataLoader<InteractionDataLoader>()
    .AddDataLoader<InteractionRepliesDataLoader>()
    .AddDataLoader<ArticleInteractionsDataLoader>()
    // Queries
    .AddQueryType<ArtigoQueryType>()
    // Mutations
    .AddMutationType<ArtigoMutationType>()
    // Types
    .AddType<ArtigoType>()
    .AddType<ArtigoViewType>()
    .AddType<ArtigoCardListType>()
    .AddType<ArtigoEditorialViewType>()
    .AddType<VolumeType>()
    .AddType<VolumeViewType>()
    .AddType<AutorType>()
    .AddType<StaffType>()
    .AddType<InteractionType>()
    .AddType<PendingType>();

// =============================================================================
// 4. PIPELINE
// =============================================================================

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseCors("MagazinePolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapGraphQL();

app.Run();