import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countries, getStatesByCountryCode, getCitiesByState } from '@/data/countryData';

interface AddressData {
  street: string;
  number: string;
  neighborhood: string;
  cep: string;
}

interface AddressFormProps {
  value: AddressData;
  onChange: (value: AddressData) => void;
  disabled?: boolean;
}

export default function AddressForm({ value, onChange, disabled = false }: AddressFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="street" className="text-xs">Rua *</Label>
          <Input
            id="street"
            value={value.street}
            onChange={(e) => onChange({ ...value, street: e.target.value })}
            placeholder="Nome da rua"
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="number" className="text-xs">Número *</Label>
          <Input
            id="number"
            value={value.number}
            onChange={(e) => onChange({ ...value, number: e.target.value })}
            placeholder="Número"
            disabled={disabled}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="neighborhood" className="text-xs">Bairro</Label>
          <Input
            id="neighborhood"
            value={value.neighborhood}
            onChange={(e) => onChange({ ...value, neighborhood: e.target.value })}
            placeholder="Nome do bairro"
            disabled={disabled}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cep" className="text-xs">CEP</Label>
          <Input
            id="cep"
            value={value.cep}
            onChange={(e) => {
              const input = e.target.value;
              // Remove tudo que não é número
              const numbers = input.replace(/\D/g, '');
              // Limita a 8 dígitos
              const cep = numbers.slice(0, 8);
              // Formata com hífen
              let formatted = cep;
              if (cep.length > 5) {
                formatted = cep.slice(0, 5) + '-' + cep.slice(5);
              }
              onChange({ ...value, cep: formatted });
            }}
            placeholder="00000-000"
            disabled={disabled}
            maxLength={9}
          />
        </div>
      </div>
    </div>
  );
}
