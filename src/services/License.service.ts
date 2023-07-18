import { AppDataSource } from '../database/dataSource';
import License from '../database/models/License.entity';
import User from '../database/models/User.entity';

const licenseRepository = AppDataSource.getRepository(License);

export const userHasLicense = async (userId: string, beatId: string): Promise<boolean> => {
  try {
    const license = await licenseRepository.findOne({ where: { user: { _id: userId }, beat: beatId } });
    if (!license) {
      return false;
    } else {
      return true;
    }
  } catch (err) {
    console.error(err);
    return Promise.reject('An error occured querying for a license');
  }
};
