
import { Assessor } from '../types';

export const MOCK_ASSESSORES: Assessor[] = [
    {
        id: '1',
        nome: 'Carlos Eduardo Silva',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        cargo: 'Assessor Regional',
        regiaoAtuacao: 'Região Metropolitana',
        municipiosCobertos: 5,
        liderancasGerenciadas: 12,
        origem: 'Alê Portela',
        telefone: '(31) 99999-1111',
        email: 'carlos.silva@portelahub.com',
        endereco: {
            logradouro: 'Rua das Flores',
            numero: '123',
            bairro: 'Centro',
            cidade: 'Belo Horizonte',
            uf: 'MG',
            cep: '30100-000'
        }
    },
    {
        id: '2',
        nome: 'Maria Fernanda Costa',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        cargo: 'Assessor Regional',
        regiaoAtuacao: 'Sul de Minas',
        municipiosCobertos: 8,
        liderancasGerenciadas: 18,
        origem: 'Lincoln Portela',
        telefone: '(35) 98888-2222',
        email: 'maria.costa@portelahub.com',
        endereco: {
            logradouro: 'Av. Paulista',
            numero: '456',
            bairro: 'Jardim',
            cidade: 'Pouso Alegre',
            uf: 'MG',
            cep: '37550-000'
        }
    },
    {
        id: '3',
        nome: 'João Pedro Santos',
        avatarUrl: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        cargo: 'Assessor Regional',
        regiaoAtuacao: 'Norte de Minas',
        municipiosCobertos: 6,
        liderancasGerenciadas: 15,
        origem: 'Alê Portela',
        telefone: '(38) 97777-3333',
        email: 'joao.santos@portelahub.com',
        endereco: {
            logradouro: 'Praça da Matriz',
            numero: '789',
            bairro: 'Centro',
            cidade: 'Montes Claros',
            uf: 'MG',
            cep: '39400-000'
        }
    },
    {
        id: '4',
        nome: 'Ana Paula Oliveira',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        cargo: 'Coordenador Político',
        regiaoAtuacao: 'Triângulo Mineiro',
        municipiosCobertos: 7,
        liderancasGerenciadas: 14,
        origem: 'Lincoln Portela',
        telefone: '(34) 96666-4444',
        email: 'ana.oliveira@portelahub.com',
        endereco: {
            logradouro: 'Rua Principal',
            numero: '101',
            bairro: 'Centro',
            cidade: 'Uberlândia',
            uf: 'MG',
            cep: '38400-000'
        }
    }
];
