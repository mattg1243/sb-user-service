import { Request, Response } from 'express';
import { getAllLicensesByUser } from '../../../services/License.service';

export const getLicensedBeatshandler = async (req: Request, res: Response) => {
  const user = req.query.user as string;
  console.log('getting licenses...');
  try {
    const licenses = await getAllLicensesByUser(user, ['license.beat']);
    let beatIds: Array<string> = [];
    licenses.map((license) => beatIds.push(license.beat));
    return res.status(200).json({ beatIds });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'An error occured getting licensed beats', err });
  }
};
