# Templates Typst do Resuna

Os três templates são mantidos como documentos ATS-friendly e recebem os dados por `resume.json`.

Uso local com o compilador Typst:

```bash
typst compile classic.typ --root . output.pdf
```

O futuro serviço Go será responsável por validar o JSON, escolher um template, criar um diretório temporário e chamar uma versão fixada do compilador Typst.

Os templates não aceitam código Typst fornecido pelo usuário. O conteúdo do currículo deve ser escrito em JSON e escapado/validado pelo renderer.
