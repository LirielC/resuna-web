#let data = json(sys.inputs.at("resume"))
#set page(paper: "a4", margin: (x: 1.6cm, y: 1.45cm))
#set text(font: "Libertinus Serif", size: 9.5pt, fill: rgb("#242424"))
#set par(leading: 0.52em, spacing: 0.38em)

#let val(item, key, fallback: "") = if key in item and item.at(key) != none { item.at(key) } else { fallback }
#let heading(title) = [
  #v(0.45em)
  #text(size: 9pt, weight: "bold", tracking: 0.08em)[#upper(title)]
  #v(0.18em)
  #line(length: 100%, stroke: 0.45pt + rgb("#c9c4bd"))
  #v(0.28em)
]
#let bullets(items) = if items != none and items.len() > 0 [
  #for item in items [- #item]
]
#let links = (val(data, "linkedin"), val(data, "github"), val(data, "website")).filter(link => link != "")

#align(center)[
  #text(size: 21pt, weight: "bold")[#val(data, "name", fallback: "Seu Nome")]
  #linebreak()
  #text(size: 8.5pt, fill: rgb("#555555"))[#val(data, "location") · #val(data, "email") · #val(data, "phone")]
  #if links.len() > 0 [
    #linebreak()
    #text(size: 8.2pt, fill: rgb("#a64b28"))[#links.join("   ·   ")]
  ]
]
#v(0.45em)
#line(length: 100%, stroke: 0.5pt + rgb("#bdb8b1"))

#if val(data, "summary") != "" [
  #heading("Perfil")
  #val(data, "summary")
]

#if val(data, "experience", fallback: none) != none and data.experience.len() > 0 [
  #heading("Experiência")
  #for item in data.experience [
    #block(below: 0.55em)[
      #let ending = if val(item, "current", fallback: false) { "Atual" } else { val(item, "endDate") }
      #text(weight: "bold")[#val(item, "title", fallback: "Cargo")]
      #if val(item, "company") != "" [ · #val(item, "company")]
      #if val(item, "location") != "" [ · #val(item, "location")]
      #linebreak()
      #text(size: 8.5pt, fill: rgb("#6b625b"))[#val(item, "startDate") #if ending != "" [– #ending]]
      #if val(item, "description") != "" [#linebreak() #val(item, "description")]
      #bullets(val(item, "bullets", fallback: none))
    ]
  ]
]

#if val(data, "projects", fallback: none) != none and data.projects.len() > 0 [
  #heading("Projetos")
  #for item in data.projects [
    #block(below: 0.48em)[
      #text(weight: "bold")[#val(item, "name", fallback: "Projeto")]
      #if val(item, "technologies", fallback: none) != none and item.technologies.len() > 0 [
        #text(size: 8.5pt, fill: rgb("#68615b"))[  (#item.technologies.join(", "))]
      ]
      #if val(item, "description") != "" [#linebreak() #val(item, "description")]
      #bullets(val(item, "bullets", fallback: none))
    ]
  ]
]

#if val(data, "education", fallback: none) != none and data.education.len() > 0 [
  #heading("Formação")
  #for item in data.education [
    #block(below: 0.3em)[
      #text(weight: "bold")[#val(item, "degree", fallback: "Formação")] · #val(item, "institution")
      #if val(item, "location") != "" [ · #val(item, "location")]
      #if val(item, "graduationDate") != "" [ · #text(size: 8.5pt, fill: rgb("#6b625b"))[#val(item, "graduationDate")]]
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
    #block(below: 0.25em)[
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
