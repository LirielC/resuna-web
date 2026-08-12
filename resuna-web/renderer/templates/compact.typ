#let data = json("resume.json")
#set page(paper: "a4", margin: (x: 1.25cm, y: 1.1cm))
#set text(font: "Libertinus Sans", size: 8.8pt)
#set par(leading: 0.45em)
#let value(key, fallback: "") = if key in data { data.at(key) } else { fallback }
#let heading(title) = [
  #v(0.45em)
  #text(weight: "bold", size: 8.8pt)[#upper(title)]
  #line(length: 100%, stroke: 0.4pt)
]
#let bullets(items) = if items != none [#for item in items [- #item #linebreak()]]

#align(center)[
  #text(size: 17pt, weight: "bold")[#value("name", "Seu Nome")]
  #linebreak()
  #value("email") · #value("location") · #value("phone")
]
#if value("summary") != "" { heading("Resumo") value("summary") }
#if "experience" in data {
  heading("Experiência")
  for item in data.experience {
    #text(weight: "bold")[#item.title] · #item.company · #item.start — #item.end
    #linebreak()
    bullets(item.highlights)
  }
}
#if "projects" in data {
  heading("Projetos")
  for item in data.projects { #text(weight: "bold")[#item.name] · #item.description #linebreak() }
}
#if "education" in data { heading("Formação") for item in data.education { #item.degree · #item.institution #linebreak() } }
#if "skills" in data { heading("Habilidades") data.skills.join(" · ") }
