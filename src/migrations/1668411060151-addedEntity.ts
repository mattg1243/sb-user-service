import { MigrationInterface, QueryRunner } from "typeorm";

export class addedEntity1668411060151 implements MigrationInterface {
    name = 'addedEntity1668411060151'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_d404b5f005ecc3a4923dbbc803b"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "uploadedBeats_id" TO "uploadedBeats"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "uploadedBeats"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "uploadedBeats" character varying array NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "uploadedBeats"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "uploadedBeats" uuid`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "uploadedBeats" TO "uploadedBeats_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_d404b5f005ecc3a4923dbbc803b" FOREIGN KEY ("uploadedBeats_id") REFERENCES "beats"("_id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
