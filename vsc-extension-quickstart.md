# 🧱 TemplateGen – Gerador de Estrutura de Projetos para VS Code

**TemplateGen** é uma extensão para o Visual Studio Code que permite criar, salvar e aplicar modelos personalizados de estrutura de projetos com apenas alguns cliques. Ideal pra quem quer manter **padrões de projeto**, **agilizar o setup** e **padronizar entre equipes**.

---

## ✨ Funcionalidades

- 🔧 Crie seus próprios templates com pastas e arquivos customizados.
- 💾 Salve esses modelos localmente como JSON.
- 🚀 Gere a estrutura completa de um projeto com apenas um comando.
- 🗂 Organize múltiplos modelos (ex: "Projeto Python", "API Node", "App React Native").

---

## 🚧 Exemplo de Uso

1. Crie um novo template:
   - Dê um nome pro template (ex: `Projeto Python`).
   - Defina a estrutura desejada:
     ```
     src/
       └── main.py
       └── utils/helpers.py
     tests/
       └── test_main.py
     README.md
     ```

2. Salve o modelo.

3. Na próxima vez que quiser iniciar um novo projeto:
   - Execute o comando `TemplateGen: Gerar Estrutura`.
   - Escolha um modelo salvo.
   - A estrutura será criada na pasta que você escolher.

---

## 📦 Instalação

Você pode instalar diretamente pela barra de extensões do VS Code:

```bash
# (futuramente)
ext install jones.templategen
