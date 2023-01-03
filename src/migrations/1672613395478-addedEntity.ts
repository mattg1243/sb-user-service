import { MigrationInterface, QueryRunner } from "typeorm";

export class addedEntity1672613395478 implements MigrationInterface {
    name = 'addedEntity1672613395478'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "linkedSocials" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "linkedSocials" SET DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "linkedSocials" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "linkedSocials" DROP NOT NULL`);
    }

}
