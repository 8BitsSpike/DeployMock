using HotChocolate;
using HotChocolate.Execution;
using System;
using System.Collections.Generic;

namespace Artigo.API.GraphQL.ErrorFilters
{
    public class ApplicationErrorFilter : IErrorFilter
    {
        public IError OnError(IError error)
        {
            return error.Exception switch
            {
                // Fix CS0104: Ambiguous reference resolved by full qualification
                System.Collections.Generic.KeyNotFoundException knfe => error.WithCode("RESOURCE_NOT_FOUND").WithMessage(knfe.Message),

                InvalidOperationException ioe => error.WithCode("BUSINESS_INVALID_OPERATION").WithMessage(ioe.Message),
                _ => error // Default behavior
            };
        }
    }
}