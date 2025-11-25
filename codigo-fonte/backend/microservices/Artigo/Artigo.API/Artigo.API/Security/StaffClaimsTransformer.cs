using Artigo.Intf.Interfaces;
using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq; // Necessário para .FirstOrDefault

namespace Artigo.API.Security
{
    /// <sumario>
    /// Transforma o ClaimsPrincipal, adicionando a função interna (FuncaoTrabalho)
    /// do usuário autenticado como uma 'Claim' de Role (FuncaoTrabalho).
    /// </sumario>
    public class StaffClaimsTransformer : IClaimsTransformation
    {
        private readonly IStaffRepository _staffRepository;

        public StaffClaimsTransformer(IStaffRepository staffRepository)
        {
            _staffRepository = staffRepository;
        }

        public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
        {
            // Tenta obter o ID de várias formas para garantir compatibilidade com o UsuarioAPI
            var userId = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? principal.FindFirstValue("sub")
                         ?? principal.FindFirstValue("id");

            if (string.IsNullOrEmpty(userId))
            {
                return principal;
            }

            // Busca o Staff no banco de dados local
            var staff = await _staffRepository.GetByUsuarioIdAsync(userId);

            // Se o usuário for um Staff ativo, adiciona a FuncaoTrabalho como Claim de Role.
            if (staff != null && staff.IsActive)
            {
                var identity = principal.Identity as ClaimsIdentity;
                if (identity == null)
                {
                    identity = new ClaimsIdentity(principal.Identity);
                }

                // Remove roles antigas para evitar duplicação ou conflito
                // (Nota: Isso é útil se o token vier com roles antigas ou incorretas)
                var existingRoleClaims = identity.FindAll(ClaimTypes.Role).ToList();
                foreach (var claim in existingRoleClaims)
                {
                    identity.RemoveClaim(claim);
                }

                // Adiciona a função de trabalho como uma claim de "Role" (.NET padrão)
                identity.AddClaim(new Claim(ClaimTypes.Role, staff.Job.ToString()));

                // Retorna um novo Principal com a identidade atualizada
                return new ClaimsPrincipal(identity);
            }

            return principal;
        }
    }
}