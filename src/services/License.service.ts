import { SelectQueryBuilder } from 'typeorm';
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

export const getAllLicensesByUser = async (userId: string, select?: string[]) => {
  try {
    let licenses: License[];
    const licensesQuery = licenseRepository
      .createQueryBuilder('license')
      .leftJoinAndSelect('license.user', 'user')
      .where('user._id = :userId', { userId });
    if (select) {
      licensesQuery.select(select);
    }
    licenses = await licensesQuery.getMany();
    return licenses;
  } catch (err) {
    console.error(err);
    return Promise.reject('An error has occured querying for licenses by user');
  }
};

export const getAllLicensedUsersByBeat = async (beatId: string) => {
  try {
    const users = await licenseRepository.find({
      where: { beat: beatId },
      relations: { user: true },
      select: { user: { _id: true } },
    });
    return users;
  } catch (err) {
    console.error(err);
    return Promise.reject('An error has occured querying for all licensed users for a beat');
  }
};
