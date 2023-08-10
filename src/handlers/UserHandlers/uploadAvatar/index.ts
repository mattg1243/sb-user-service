import { Request, Response } from 'express';
import { uploadFileToS3 } from '../../../bucket/upload';
import { updateUserById } from '../../../services/User.service';
import fs from 'fs';
import path from 'path';

export const uploadAvatarHandler = async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) {
    console.log('Middleware failed to attach user to request ');
    return res.status(400).json({ message: 'Middleware failed to attach user to request' });
  }

  const newAvatar = req.file;
  if (!newAvatar) {
    return res.status(400).json({ message: 'no file detected while updating avatar' });
  }

  try {
    const uploadAvatarRes = await uploadFileToS3(newAvatar);
    if (!uploadAvatarRes) {
      console.log('error uploading image file');
      return res.status(500).json('error uploading image');
    }
    const avatarKey = uploadAvatarRes.Key;
    const updateUserRes = updateUserById(user.id, { avatar: avatarKey });
    console.log(updateUserRes);
    fs.unlink(path.join(__dirname, '../../../uploads/', newAvatar.filename), () => {
      return res.status(200).json({ message: 'avatar updated successfully' });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'an error occured while uploading your new avatar to storage' });
  }
};
