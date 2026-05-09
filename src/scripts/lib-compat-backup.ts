/**
 * Library Compatibility Table
 * Shows equivalent libraries across languages by category.
 */

// ============================================================================
// DATA
// ============================================================================

const LANGUAGES = ['JavaScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'PHP'];

const CATEGORIES = [
    'Backend Framework',
    'HTTP Client',
    'ORM / Database',
    'Testing',
    'Logging',
    'Validation',
    'Auth / Security',
];

// type: 'included' = part of stdlib/runtime, 'external' = requires package manager
const COMPAT_TABLE = {
    'Backend Framework': {
        'JavaScript': [
            { name: 'Express', type: 'external' },
            { name: 'Fastify', type: 'external' },
            { name: 'Hono', type: 'external' },
        ],
        'Python': [
            { name: 'FastAPI', type: 'external' },
            { name: 'Flask', type: 'external' },
            { name: 'Django', type: 'external' },
        ],
        'Java': [
            { name: 'Spring Boot', type: 'external' },
            { name: 'Quarkus', type: 'external' },
            { name: 'Micronaut', type: 'external' },
        ],
        'C#': [
            { name: 'ASP.NET Core', type: 'included' },
            { name: 'Carter', type: 'external' },
            { name: 'FastEndpoints', type: 'external' },
        ],
        'Go': [
            { name: 'net/http', type: 'included' },
            { name: 'Gin', type: 'external' },
            { name: 'Fiber', type: 'external' },
        ],
        'Rust': [
            { name: 'Axum', type: 'external' },
            { name: 'Actix-web', type: 'external' },
            { name: 'Rocket', type: 'external' },
        ],
        'PHP': [
            { name: 'Laravel', type: 'external' },
            { name: 'Symfony', type: 'external' },
            { name: 'Slim', type: 'external' },
        ],
    },
    'HTTP Client': {
        'JavaScript': [
            { name: 'fetch', type: 'included' },
            { name: 'Axios', type: 'external' },
            { name: 'ky', type: 'external' },
        ],
        'Python': [
            { name: 'urllib', type: 'included' },
            { name: 'httpx', type: 'external' },
            { name: 'requests', type: 'external' },
        ],
        'Java': [
            { name: 'java.net.http', type: 'included' },
            { name: 'OkHttp', type: 'external' },
            { name: 'Retrofit', type: 'external' },
        ],
        'C#': [
            { name: 'HttpClient', type: 'included' },
            { name: 'Refit', type: 'external' },
            { name: 'RestSharp', type: 'external' },
        ],
        'Go': [
            { name: 'net/http', type: 'included' },
            { name: 'Resty', type: 'external' },
            { name: 'req', type: 'external' },
        ],
        'Rust': [
            { name: 'reqwest', type: 'external' },
            { name: 'ureq', type: 'external' },
            { name: 'hyper', type: 'external' },
        ],
        'PHP': [
            { name: 'cURL ext.', type: 'included' },
            { name: 'Guzzle', type: 'external' },
            { name: 'symfony/http-client', type: 'external' },
        ],
    },
    'ORM / Database': {
        'JavaScript': [
            { name: 'Prisma', type: 'external' },
            { name: 'Drizzle ORM', type: 'external' },
            { name: 'TypeORM', type: 'external' },
        ],
        'Python': [
            { name: 'SQLAlchemy', type: 'external' },
            { name: 'Tortoise ORM', type: 'external' },
            { name: 'Peewee', type: 'external' },
        ],
        'Java': [
            { name: 'Hibernate', type: 'external' },
            { name: 'jOOQ', type: 'external' },
            { name: 'MyBatis', type: 'external' },
        ],
        'C#': [
            { name: 'EF Core', type: 'external' },
            { name: 'Dapper', type: 'external' },
            { name: 'NHibernate', type: 'external' },
        ],
        'Go': [
            { name: 'GORM', type: 'external' },
            { name: 'sqlx', type: 'external' },
            { name: 'Bun', type: 'external' },
        ],
        'Rust': [
            { name: 'SQLx', type: 'external' },
            { name: 'Diesel', type: 'external' },
            { name: 'SeaORM', type: 'external' },
        ],
        'PHP': [
            { name: 'Doctrine ORM', type: 'external' },
            { name: 'Eloquent', type: 'external' },
            { name: 'Cycle ORM', type: 'external' },
        ],
    },
    'Testing': {
        'JavaScript': [
            { name: 'Vitest', type: 'external' },
            { name: 'Jest', type: 'external' },
            { name: 'Mocha', type: 'external' },
        ],
        'Python': [
            { name: 'unittest', type: 'included' },
            { name: 'pytest', type: 'external' },
            { name: 'hypothesis', type: 'external' },
        ],
        'Java': [
            { name: 'JUnit 5', type: 'external' },
            { name: 'Mockito', type: 'external' },
            { name: 'AssertJ', type: 'external' },
        ],
        'C#': [
            { name: 'MSTest', type: 'included' },
            { name: 'xUnit', type: 'external' },
            { name: 'Moq', type: 'external' },
        ],
        'Go': [
            { name: 'testing', type: 'included' },
            { name: 'testify', type: 'external' },
            { name: 'Ginkgo', type: 'external' },
        ],
        'Rust': [
            { name: 'built-in tests', type: 'included' },
            { name: 'mockall', type: 'external' },
            { name: 'rstest', type: 'external' },
        ],
        'PHP': [
            { name: 'PHPUnit', type: 'external' },
            { name: 'Pest', type: 'external' },
            { name: 'Mockery', type: 'external' },
        ],
    },
    'Logging': {
        'JavaScript': [
            { name: 'console', type: 'included' },
            { name: 'Pino', type: 'external' },
            { name: 'Winston', type: 'external' },
        ],
        'Python': [
            { name: 'logging', type: 'included' },
            { name: 'Loguru', type: 'external' },
            { name: 'structlog', type: 'external' },
        ],
        'Java': [
            { name: 'java.util.logging', type: 'included' },
            { name: 'Logback', type: 'external' },
            { name: 'Log4j 2', type: 'external' },
        ],
        'C#': [
            { name: 'M.E.Logging', type: 'included' },
            { name: 'Serilog', type: 'external' },
            { name: 'NLog', type: 'external' },
        ],
        'Go': [
            { name: 'log/slog', type: 'included' },
            { name: 'Zap', type: 'external' },
            { name: 'zerolog', type: 'external' },
        ],
        'Rust': [
            { name: 'tracing', type: 'external' },
            { name: 'log', type: 'external' },
            { name: 'env_logger', type: 'external' },
        ],
        'PHP': [
            { name: 'error_log()', type: 'included' },
            { name: 'Monolog', type: 'external' },
        ],
    },
    'Validation': {
        'JavaScript': [
            { name: 'Zod', type: 'external' },
            { name: 'Yup', type: 'external' },
            { name: 'Valibot', type: 'external' },
        ],
        'Python': [
            { name: 'Pydantic', type: 'external' },
            { name: 'marshmallow', type: 'external' },
            { name: 'cerberus', type: 'external' },
        ],
        'Java': [
            { name: 'jakarta.validation', type: 'external' },
            { name: 'Hibernate Validator', type: 'external' },
        ],
        'C#': [
            { name: 'DataAnnotations', type: 'included' },
            { name: 'FluentValidation', type: 'external' },
            { name: 'GuardClauses', type: 'external' },
        ],
        'Go': [
            { name: 'validator/v10', type: 'external' },
            { name: 'govalidator', type: 'external' },
        ],
        'Rust': [
            { name: 'validator', type: 'external' },
            { name: 'garde', type: 'external' },
        ],
        'PHP': [
            { name: 'Respect Validation', type: 'external' },
            { name: 'Laravel Validator', type: 'external' },
            { name: 'Rakit Validation', type: 'external' },
        ],
    },
    'Auth / Security': {
        'JavaScript': [
            { name: 'Passport', type: 'external' },
            { name: 'jose', type: 'external' },
            { name: 'better-auth', type: 'external' },
        ],
        'Python': [
            { name: 'python-jose', type: 'external' },
            { name: 'authlib', type: 'external' },
            { name: 'passlib', type: 'external' },
        ],
        'Java': [
            { name: 'Spring Security', type: 'external' },
            { name: 'java-jwt', type: 'external' },
            { name: 'nimbus-jose-jwt', type: 'external' },
        ],
        'C#': [
            { name: 'ASP.NET Core Auth', type: 'included' },
            { name: 'BCrypt.Net', type: 'external' },
            { name: 'IdentityModel', type: 'external' },
        ],
        'Go': [
            { name: 'golang-jwt/jwt', type: 'external' },
            { name: 'golang.org/x/oauth2', type: 'external' },
        ],
        'Rust': [
            { name: 'jsonwebtoken', type: 'external' },
            { name: 'argon2', type: 'external' },
            { name: 'bcrypt', type: 'external' },
        ],
        'PHP': [
            { name: 'firebase/php-jwt', type: 'external' },
            { name: 'lcobucci/jwt', type: 'external' },
            { name: 'defuse/php-encryption', type: 'external' },
        ],
    },
};

// ============================================================================
// BUILD TABLE
// ============================================================================

function buildTable() {
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    if (!thead || !tbody) return;

    // Header row
    const headerRow = document.createElement('tr');
    const thCat = document.createElement('th');
    thCat.className = 'sticky-col';
    thCat.style.minWidth = '120px';
    thCat.textContent = 'Category';
    headerRow.appendChild(thCat);

    for (const lang of LANGUAGES) {
        const th = document.createElement('th');
        th.className = 'lang-col';
        th.textContent = lang;
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);

    // Data rows
    for (const category of CATEGORIES) {
        const tr = document.createElement('tr');

        const tdCat = document.createElement('td');
        tdCat.className = 'sticky-col category-cell';
        tdCat.textContent = category;
        tr.appendChild(tdCat);

        for (const lang of LANGUAGES) {
            const td = document.createElement('td');
            td.className = 'lang-cell';
            const libs = COMPAT_TABLE[category]?.[lang] ?? [];
            for (const lib of libs) {
                const item = document.createElement('div');
                item.className = 'compat-lib-item';
                const nameNode = document.createTextNode(lib.name + '\u00A0');
                const badge = document.createElement('span');
                badge.className = `compat-badge compat-badge-${lib.type}`;
                badge.textContent = lib.type === 'included' ? 'included' : 'external';
                item.appendChild(nameNode);
                item.appendChild(badge);
                td.appendChild(item);
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
}

// ============================================================================
// SEARCH
// ============================================================================

function setupSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', () => {
        const q = input.value.toLowerCase();
        document.querySelectorAll('#tableBody tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    });
}

// ============================================================================
// INIT
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    buildTable();
    setupSearch();
});
