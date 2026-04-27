<?php
// src/Model/User.php

class User {
    private ?int $id;
    private string $fullName;
    private string $email;
    private string $passwordHash;
    private string $role;

    public function __construct(
        string $fullName,
        string $email,
        string $passwordHash,
        string $role = 'USER',
        ?int $id = null
    ) {
        $this->fullName = $fullName;
        $this->email = $email;
        $this->passwordHash = $passwordHash;
        $this->role = $role;
        $this->id = $id;
    }

    // Getters
    public function getId(): ?int { return $this->id; }
    public function getFullName(): string { return $this->fullName; }
    public function getEmail(): string { return $this->email; }
    public function getPasswordHash(): string { return $this->passwordHash; }
    public function getRole(): string { return $this->role; }
}