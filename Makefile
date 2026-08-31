.PHONY: build new open

build:
	go run gen.go

new:
	go run gen.go new

open:
	open index.html
