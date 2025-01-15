import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig.js';
import admin from '../config/admFirebase.js'; 

export const disableUser = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'ID do usuário não fornecido' });
  }

  try {
    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, { disabled: true });

    await admin.auth().updateUser(userId, { disabled: true });

    res.status(200).json({ message: 'Usuário desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({ message: 'Erro ao desativar usuário', error });
  }
};

export const activeUser = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'ID do usuário não fornecido' });
  }

  try {
    const userRef = doc(db, 'usuarios', userId);
    await updateDoc(userRef, { disabled: false });

    await admin.auth().updateUser(userId, { disabled: false });

    res.status(200).json({ message: 'Usuário ativado com sucesso' });
  } catch (error) {
    console.error('Erro ao ativar usuário:', error);
    res.status(500).json({ message: 'Erro ao ativar usuário', error });
  }
};

