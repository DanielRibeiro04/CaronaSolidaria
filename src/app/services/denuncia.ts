import { Injectable } from '@angular/core';
import { collection, addDoc } from 'firebase/firestore';
import { firebaseDb } from '../firebase.config';

export interface Denuncia {
  id: string;
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
  private denunciasCollection = 'denuncias';

  async registrar(denuncia: Omit<Denuncia, 'id' | 'criadoEm'>): Promise<Denuncia> {
    const novaDenuncia: Omit<Denuncia, 'id'> = {
      criadoEm: new Date().toISOString(),
      usuarioNome: denuncia.usuarioNome.trim(),
      usuarioEmail: denuncia.usuarioEmail.trim().toLowerCase(),
      assunto: denuncia.assunto.trim(),
      descricao: denuncia.descricao.trim()
    };

    const docRef = await addDoc(collection(firebaseDb, this.denunciasCollection), novaDenuncia);

    return {
      ...novaDenuncia,
      id: docRef.id
    };
  }

  // Método mantido para compatibilidade, mas agora retorna array vazio
  // As denúncias são enviadas para o Firestore e não ficam armazenadas localmente
  listar(): Denuncia[] {
    return [];
  }
}
