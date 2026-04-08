import { Injectable } from '@angular/core';

export interface Denuncia {
  id: number;
  usuarioNome: string;
  usuarioEmail: string;
  assunto: string;
  descricao: string;
  criadoEm: string;
}

@Injectable({
  providedIn: 'root'
})
export class DenunciaService {
  private readonly storageKey = 'denuncias_enviadas';

  registrar(denuncia: Omit<Denuncia, 'id' | 'criadoEm'>): Denuncia {
    const denuncias = this.listar();
    const maiorId = denuncias.reduce((max, item) => Math.max(max, item.id), 0);

    const novaDenuncia: Denuncia = {
      id: maiorId + 1,
      criadoEm: new Date().toISOString(),
      usuarioNome: denuncia.usuarioNome.trim(),
      usuarioEmail: denuncia.usuarioEmail.trim().toLowerCase(),
      assunto: denuncia.assunto.trim(),
      descricao: denuncia.descricao.trim()
    };

    denuncias.push(novaDenuncia);
    localStorage.setItem(this.storageKey, JSON.stringify(denuncias));
    return novaDenuncia;
  }

  listar(): Denuncia[] {
    const valor = localStorage.getItem(this.storageKey);
    if (!valor) {
      return [];
    }

    try {
      return JSON.parse(valor) as Denuncia[];
    } catch {
      return [];
    }
  }
}
