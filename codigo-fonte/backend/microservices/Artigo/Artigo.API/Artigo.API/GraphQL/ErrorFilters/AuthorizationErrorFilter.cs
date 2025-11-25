using HotChocolate; // <--- ESSENTIAL: Contains IErrorFilter
using HotChocolate.Execution; // Contains IError
using System;

namespace Artigo.API.GraphQL.ErrorFilters
{
    public class AuthorizationErrorFilter : IErrorFilter
    {
        public IError OnError(IError error)
        {
            if (error.Exception is UnauthorizedAccessException)
            {
                return error.WithCode("AUTH_FORBIDDEN")
                            .WithMessage("Acesso negado. O usuário não tem as permissões necessárias para executar esta ação.");
            }
            return error;
        }
    }
}