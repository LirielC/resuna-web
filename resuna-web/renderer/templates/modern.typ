#let data = json("resume.json")
#set page(paper: "a4", margin: (x: 1.7cm, y: 1.5cm))
#set text(font: "Libertinus Sans", size: 9.5pt)
#set par(leading: 0.55em)
#let value(key, fallback: "") = if key in data { data.at(key) } else { fallback }
#let heading(title) = [
  #v(0.65em)
  #block(stroke: (left: 2pt + rgb("#C45D32")), inset: (left: 7pt))[
    #text(fill: rgb("#A64B28"), weight: "bold")[#upper(title)]
  ]
]
#let bullets(items) = if items != none [#for item in items [- #item #linebreak()]]

#text(size: 22pt, weight: "bold")[#value("name", "Seu Nome")]
#linebreak()
#text(size: 9pt, fill: rgb("#666666"))[#value("email") · #value("location") · #value("phone")]

#if value("summary") != "" { heading("Resumo profissional") value("summary") }
#if "experience" in data {
  heading("Experiência profissional")
  for item in data.experience {
    #text(weight: "bold")[#item.title] · #item.company
    #linebreak()
    #text(fill: rgb("#666666"))[#item.start — #item.end]
    #linebreak()
    bullets(item.highlights)
  }
}
#if "education" in data {
  heading("Formação acadêmica")
  for item in data.education { #text(weight: "bold")[#item.degree] · #item.institution #linebreak() }
}
#if "skills" in data { heading("Habilidades") data.skills.join(" · ") }
