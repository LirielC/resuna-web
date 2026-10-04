#let data = json(sys.inputs.at("resume"))
#set page(paper: "a4", margin: (x: 1.5cm, y: 1.4cm))
#set text(font: "Libertinus Serif", size: 8.8pt, fill: rgb("#222222"))
#set par(leading: 0.45em, spacing: 0.28em)

#let val(item, key, fallback: "") = if key in item and item.at(key) != none { item.at(key) } else { fallback }
#let heading(title) = [
  #v(0.38em)
  #text(size: 8.5pt, weight: "bold", tracking: 0.06em)[#upper(title)]
  #v(0.12em)
  #line(length: 100%, stroke: 0.4pt + rgb("#c9c4bd"))
  #v(0.2em)
]
#let bullets(items) = if items != none and items.len() > 0 [
  #for item in items [- #item]
]
#let links = (val(data, "linkedin"), val(data, "github"), val(data, "website")).filter(link => link != "")

#align(center)[
  #text(size: 17pt, weight: "bold")[#val(data, "name", fallback: "Seu Nome")]
  #linebreak()
  #text(size: 8pt, fill: rgb("#555555"))[#val(data, "location") · #val(data, "email") · #val(data, "phone")]
  #if links.len() > 0 [
    #linebreak()
    #text(size: 7.8pt, fill: rgb("#a64b28"))[#links.join(" · ")]
  ]
]
#v(0.3em)
#line(length: 100%, stroke: 0.45pt + rgb("#c9c4bd"))

#if val(data, "summary") != "" [
  #heading("Perfil")
  #val(data, "summary")
]

#if val(data, "experience", fallback: none) != none and data.experience.len() > 0 [
  #heading("Experiência")
  #for item in data.experience [
    #block(below: 0.32em)[
      #let ending = if val(item, "current", fallback: false) { "Atual" } else { val(item, "endDate") }
      #text(weight: "bold")[#val(item, "title", fallback: "Cargo")] · #val(item, "company")
      #text(size: 8pt, fill: rgb("#655d56"))[  #val(item, "startDate") #if ending != "" [– #ending]#if val(item, "location") != "" [ · #val(item, "location")]]
      #if val(item, "description") != "" [#linebreak() #val(item, "description")]
      #bullets(val(item, "bullets", fallback: none))
    ]
  ]
]

#if val(data, "projects", fallback: none) != none and data.projects.len() > 0 [
  #heading("Projetos")
  #for item in data.projects [
    #block(below: 0.3em)[
      #text(weight: "bold")[#val(item, "name", fallback: "Projeto")]
      #if val(item, "technologies", fallback: none) != none and item.technologies.len() > 0 [
        #text(size: 8pt, fill: rgb("#68615b"))[  (#item.technologies.join(", "))]
      ]
      #if val(item, "description") != "" [#linebreak() #val(item, "description")]
      #bullets(val(item, "bullets", fallback: none))
    ]
  ]
]

#if val(data, "education", fallback: none) != none and data.education.len() > 0 [
  #heading("Formação")
  #for item in data.education [
    #block(below: 0.2em)[
      #text(weight: "bold")[#val(item, "degree", fallback: "Formação")] · #val(item, "institution")
      #if val(item, "graduationDate") != "" [ · #val(item, "graduationDate")]
    ]
  ]
]

#if val(data, "skills", fallback: none) != none and data.skills.len() > 0 [
  #heading("Habilidades")
  #data.skills.join(" · ")
]

#if val(data, "certifications", fallback: none) != none and data.certifications.len() > 0 [
  #heading("Certificações")
  #for item in data.certifications [
    #block(below: 0.15em)[
      #text(weight: "bold")[#val(item, "name")]
      #if val(item, "issuer") != "" [ · #val(item, "issuer")]
      #if val(item, "date") != "" [ · #val(item, "date")]
    ]
  ]
]

#if val(data, "languages", fallback: none) != none and data.languages.len() > 0 [
  #heading("Idiomas")
  #data.languages.filter(item => val(item, "name") != "").map(item => [#val(item, "name") #if val(item, "level") != "" [(#val(item, "level"))]]).join(" · ")
]
