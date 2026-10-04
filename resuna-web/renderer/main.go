package main

import (
	"bytes"
	"context"
	"embed"
	"encoding/json"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

//go:embed templates/*.typ
var templates embed.FS

type request struct {
	Resume map[string]any `json:"resume"`
	Theme  string         `json:"theme"`
}

func main() {
	http.HandleFunc("/health", health)
	http.HandleFunc("/render", render)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		panic(err)
	}
}

func health(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }

func render(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var in request
	decoder := json.NewDecoder(http.MaxBytesReader(w, r.Body, 256<<10))
	if err := decoder.Decode(&in); err != nil || in.Resume == nil {
		http.Error(w, "invalid resume", http.StatusBadRequest)
		return
	}
	if in.Theme == "" {
		in.Theme = "classic"
	}
	if in.Theme != "classic" && in.Theme != "modern" && in.Theme != "compact" {
		http.Error(w, "invalid theme", http.StatusBadRequest)
		return
	}

	dir, err := os.MkdirTemp("", "resuna-render-")
	if err != nil {
		http.Error(w, "temporary directory unavailable", http.StatusInternalServerError)
		return
	}
	defer os.RemoveAll(dir)

	normalize(in.Resume)
	data, err := json.Marshal(in.Resume)
	if err != nil {
		http.Error(w, "invalid resume", http.StatusBadRequest)
		return
	}
	if err = os.WriteFile(filepath.Join(dir, "resume.json"), data, 0600); err != nil {
		http.Error(w, "write failed", http.StatusInternalServerError)
		return
	}
	template, err := templates.ReadFile("templates/" + in.Theme + ".typ")
	if err != nil {
		http.Error(w, "template unavailable", http.StatusInternalServerError)
		return
	}
	if err = os.WriteFile(filepath.Join(dir, "resume.typ"), template, 0600); err != nil {
		http.Error(w, "write failed", http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	cmd := exec.CommandContext(ctx, "typst", "compile", "resume.typ", "resume.pdf", "--root", dir, "--input", "resume=resume.json")
	cmd.Dir = dir
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err = cmd.Run(); err != nil {
		if ctx.Err() != nil {
			http.Error(w, "render timeout", http.StatusGatewayTimeout)
			return
		}
		http.Error(w, "render failed: "+strings.TrimSpace(stderr.String()), http.StatusUnprocessableEntity)
		return
	}
	pdf, err := os.ReadFile(filepath.Join(dir, "resume.pdf"))
	if err != nil {
		http.Error(w, "pdf unavailable", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/pdf")
	w.Write(pdf)
}

func normalize(r map[string]any) {
	info, _ := r["personalInfo"].(map[string]any)
	if info != nil {
		if v, ok := info["fullName"]; ok {
			r["name"] = v
		}
		for _, key := range []string{"email", "phone", "location", "linkedin", "github", "website"} {
			if v, ok := info[key]; ok {
				r[key] = v
			}
		}
	}
	for _, key := range []string{"summary", "experience", "projects", "education", "skills", "certifications", "languages"} {
		if _, ok := r[key]; !ok {
			r[key] = nil
		}
	}
	for _, key := range []string{"experience", "projects", "education", "certifications", "languages"} {
		if items, ok := r[key].([]any); ok {
			for _, raw := range items {
				if item, ok := raw.(map[string]any); ok {
					switch key {
					case "experience":
						// Experience.title is already the canonical API field.
					case "education":
						if item["graduationDate"] == nil { item["graduationDate"] = item["endDate"] }
					}
					if v, exists := item["bullets"]; exists {
						item["highlights"] = v
					}
				}
			}
		}
	}
}
