<h1>Pratća dokumentacija uz rad na temu <i>Automatizacija Git radnog toka upotrebom fino podešenog LLM agenta</i></h1>

<p>Sam istrenirani model možete naći na sledećem <a href = "https://imipmf-my.sharepoint.com/:u:/g/personal/101-2023_pmf_kg_ac_rs/IQDBSi6z3ODjS7cHSKQf8OsEAZV1XbQve0KfuobScopzmTc?e=gkKbxs">LINKU</a>.</p>

<p>Trening set podataka je izvučen iz sledećih repozitorijuma:</p>

```json
[
    {"owner": "torvalds", "name": "linux", "count": 150},
    {"owner": "microsoft", "name": "vscode", "count": 150},
    {"owner": "angular", "name": "angular", "count": 150},
    {"owner": "nestjs", "name": "nest", "count": 150},
    {"owner": "django", "name": "django", "count": 150},
    {"owner": "pallets", "name": "flask", "count": 150},
    {"owner": "spring-projects", "name": "spring-boot", "count": 150},
    {"owner": "microsoft", "name": "TypeScript", "count": 150},
    {"owner": "dotnet", "name": "runtime", "count": 150},
    {"owner": "llvm", "name": "llvm-project", "count": 150},
    {"owner": "opencv", "name": "opencv", "count": 150},
    {"owner": "facebook", "name": "react", "count": 150},
    {"owner": "vuejs", "name": "core", "count": 150},
    {"owner": "godotengine", "name": "godot", "count": 150}
]
```

<p>Test set podataka je izvučen iz sledećih repozitorijuma:</p>

```json
[
    {"owner": "angular", "name": "angular", "count": 1},
    {"owner": "nestjs", "name": "nest", "count": 1},
    {"owner": "nrwl", "name": "nx", "count": 1},
    {"owner": "vitejs", "name": "vite", "count": 1},
    {"owner": "conventional-changelog", "name": "commitlint", "count": 1},
    {"owner": "vercel", "name": "next.js", "count": 1},
    {"owner": "facebook", "name": "react", "count": 1},
    {"owner": "vuejs", "name": "core", "count": 1},
    {"owner": "django", "name": "django", "count": 1},
    {"owner": "tiangolo", "name": "fastapi", "count": 1},
    {"owner": "psf", "name": "requests", "count": 1},
    {"owner": "golang", "name": "go", "count": 1},
    {"owner": "spf13", "name": "cobra", "count": 1},
    {"owner": "rust-lang", "name": "rust", "count": 1},
    {"owner": "tokio-rs", "name": "tokio", "count": 1},
    {"owner": "dotnet", "name": "runtime", "count": 1},
    {"owner": "dotnet", "name": "aspnetcore", "count": 1},
    {"owner": "spring-projects", "name": "spring-boot", "count": 1},
    {"owner": "laravel", "name": "laravel", "count": 1},
    {"owner": "electron", "name": "electron", "count": 1},
    {"owner": "torvalds", "name": "linux", "count": 1},
    {"owner": "llvm", "name": "llvm-project", "count": 1},
    {"owner": "php", "name": "php-src", "count": 1},
    {"owner": "symfony", "name": "symfony", "count": 1},
    {"owner": "rails", "name": "rails", "count": 1},
    {"owner": "JetBrains", "name": "kotlin", "count": 1},
    {"owner": "apple", "name": "swift", "count": 1},
    {"owner": "dotnet", "name": "roslyn", "count": 1},
    {"owner": "godotengine", "name": "godot", "count": 1},
    {"owner": "bitcoin", "name": "bitcoin", "count": 1},
    {"owner": "elastic", "name": "elasticsearch", "count": 1},
    {"owner": "apache", "name": "kafka", "count": 1},
    {"owner": "apache", "name": "spark", "count": 1},
    {"owner": "couchbase", "name": "couchbase-lite-ios", "count": 1},
    {"owner": "redis", "name": "redis", "count": 1}
]
```
