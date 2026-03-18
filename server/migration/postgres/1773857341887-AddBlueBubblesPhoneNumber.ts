import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBlueBubblesPhoneNumber1773857341887 implements MigrationInterface {
  name = 'AddBlueBubblesPhoneNumber1773857341887';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" ADD "blueBubblesPhoneNumber" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_settings" DROP COLUMN "blueBubblesPhoneNumber"`
    );
  }
}
