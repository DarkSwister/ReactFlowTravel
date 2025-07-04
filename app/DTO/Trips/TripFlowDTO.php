<?php
namespace App\DTO\Trips;

class TripFlowDTO
{
    public function __construct(
        public string $tripId,
        public array $nodes,
        public array $edges,
        public array $enabledFlags,
        public ?string $userId = null
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            tripId: $data['tripId'],
            nodes: $data['nodes'] ?? [],
            edges: $data['edges'] ?? [],
            enabledFlags: $data['enabledFlags'] ?? [],
            userId: $data['userId'] ?? null
        );
    }

    public function toArray(): array
    {
        return [
            'tripId' => $this->tripId,
            'nodes' => $this->nodes,
            'edges' => $this->edges,
            'enabledFlags' => $this->enabledFlags,
            'userId' => $this->userId
        ];
    }
}
