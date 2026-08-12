#let data = json("resume.json")
#set page(paper: "a4", margin: (x: 1.6cm, y: 1.5cm))
#set text(font: "Libertinus Sans", size: 9.5pt, fill: rgb("#222222"))
#set par(leading: 0.55em)

#let value(key, fallback: "") = if key in data { data.at(key) } else { fallback }
#let heading(title) = [
  #v(0.65em)
  #text(weight: "bold", size: 9.5pt)[#upper(title)]
  #line(length: 100%, stroke: 0.5pt)
  #v(0.25em)
]
#let bullets(items) = if items != none [#for item in items [- #item #linebreak()]]

#align(center)[
  #text(size: 20pt, weight: "bold")[#value("name", "Seu Nome")]
  #linebreak()
  #text(size: 9pt, fill: rgb("#555555"))[
    #value("email") · #value("location") · #value("phone")
  ]
]

#if value("summary") != "" {
  heading("Resumo profissional")
  value("summary")
}

#if "experience" in data {
  heading("Experiência profissional")
  for item in data.experience {
    #text(weight: "bold")[#item.title] · #item.company \
    #align(right)[#item.start — #item.end]
    #linebreak()
    bullets(item.highlights)
  }
}

#if "projects" in data {
  heading("Projetos")
  for item in data.projects {
    #text(weight: "bold")[#item.name] \
    #if "description" in item [#linebreak() #item.description]
    #bullets(item.highlights)
  }
}

#if "education" in data {
  heading("Formação acadêmica")
  for item in data.education {
    #text(weight: "bold")[#item.degree] · #item.institution
    #linebreak()
  }
}

#if "skills" in data {
  heading("Habilidades")
  data.skills.join(" · ")
}
