import { Request, Response } from 'express';
import { UpdateUserInput } from '../../../database/schemas/User.schema';
import { makeValidUrl } from '../../../utils/stringMatchers';
import { validSocialLinkDomains } from '../../../database/schemas/User.schema';
import { updateUserById } from '../../../services/User.service';
import axios from 'axios';
import { BEATS_HOST } from '../../User.handler';

// TODO: make a zod schema for this request body
export const updateUserHandler = async (req: Request<{}, {}, UpdateUserInput>, res: Response) => {
  const user = req.user;
  const token = req.token;
  if (!user) {
    console.log('Middleware failed to attach user to request ');
    return res.status(400).json({ message: 'Middleware failed to attach user to request' });
  }

  const { artistName, bio, socialLink } = req.body;
  try {
    // validate the socialLink
    let socialLinkValidUrl: URL | undefined;
    if (socialLink) {
      socialLinkValidUrl = makeValidUrl(socialLink);
      console.log('social link domain:', socialLinkValidUrl.hostname);
      if (!validSocialLinkDomains.includes(socialLinkValidUrl.host)) {
        return res.status(400).json({ message: 'Invalid social link' });
      }
    } else {
      socialLinkValidUrl = undefined;
    }

    const updatedUser = await updateUserById(user.id, {
      artistName,
      bio,
      socialLink: socialLinkValidUrl ? socialLinkValidUrl.toString() : undefined,
    });

    // check if artistName has been updated and if so, update their beats
    if (artistName !== user.artistName) {
      // this axios request will be made a gRPC remote function call
      const updatedBeatsResponse = await axios.post(
        `${BEATS_HOST}/update-artist-name/${user.id}`,
        {
          artistName,
        },
        {
          withCredentials: true,
          headers: {
            Cookie: `sb-access-token=${token}`,
          },
        }
      );
    }
    console.log(updatedUser);
    return res.status(200).json({ message: 'user info successfully updated' });
  } catch (err) {
    console.error(err);
    return res.status(503).json(err);
  }
};
