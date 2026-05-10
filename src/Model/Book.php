<?php
// src/Model/Book.php

class Book implements \JsonSerializable {
    private ?int $id;
    private string $title;
    private string $author;
    private string $description;
    private int $totalQuantity;
    private int $availableQuantity;
    private ?int $categoryId;
    private ?string $categoryName;
    private ?string $imageUrl; 
    private ?int $languageId;
    private ?string $languageName;

    public function __construct(
        string $title,
        string $author,
        string $description,
        int $totalQuantity,
        int $availableQuantity,
        ?int $id = null,
        ?int $categoryId = null,
        ?string $categoryName = null,
        ?string $imageUrl = null ,
        ?int $languageId = null,
        ?string $languageName = null
    ) {
        $this->title = $title;
        $this->author = $author;
        $this->description = $description;
        $this->totalQuantity = $totalQuantity;
        $this->availableQuantity = $availableQuantity;
        $this->id = $id;
        $this->categoryId = $categoryId;
        $this->categoryName = $categoryName;
        $this->imageUrl = $imageUrl; 
        $this->languageId = $languageId;
        $this->languageName = $languageName;
    }

    // Getters
    public function getId(): ?int { return $this->id; }
    public function getTitle(): string { return $this->title; }
    public function getAuthor(): string { return $this->author; }
    public function getDescription(): string { return $this->description; }
    public function getTotalQuantity(): int { return $this->totalQuantity; }
    public function getAvailableQuantity(): int { return $this->availableQuantity; }
    public function getCategoryId(): ?int { return $this->categoryId; }
    public function getCategoryName(): ?string { return $this->categoryName; }
    public function getImageUrl(): ?string { return $this->imageUrl; } 
    public function getLanguageId(): ?int { return $this->languageId; }
    public function getLanguageName(): ?string { return $this->languageName; }
    

    // 👇 3. MODIFIE CETTE FONCTION 👇
    public function jsonSerialize(): mixed {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'author' => $this->author,
            'description' => $this->description,
            'totalQuantity' => $this->totalQuantity,
            'availableQuantity' => $this->availableQuantity,
            'categoryId' => $this->categoryId,
            'categoryName' => $this->categoryName, 
            'imageUrl' => $this->imageUrl,
            'languageId' => $this->languageId,
            'languageName' => $this->languageName,
        ];
    }
}
    