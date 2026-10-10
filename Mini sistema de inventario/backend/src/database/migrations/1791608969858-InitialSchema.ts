import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1791608969858 implements MigrationInterface {
    name = 'InitialSchema1791608969858'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."movement_type" AS ENUM('IN', 'OUT')`);
        await queryRunner.query(`CREATE TABLE "movements" ("id" SERIAL NOT NULL, "product_id" integer NOT NULL, "type" "public"."movement_type" NOT NULL, "quantity" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "note" text, CONSTRAINT "CHK_movements_quantity_positive" CHECK ("quantity" > 0), CONSTRAINT "PK_5a8e3da15ab8f2ce353e7f58f67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_movements_product_created" ON "movements"  ("product_id", "created_at") `);
        await queryRunner.query(`CREATE TABLE "products" ("id" SERIAL NOT NULL, "name" character varying(150) NOT NULL, "sku" character varying(50) NOT NULL, "price" numeric(12,2) NOT NULL, "stock" integer NOT NULL DEFAULT '0', "category_id" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku"), CONSTRAINT "CHK_products_price_non_negative" CHECK ("price" >= 0), CONSTRAINT "CHK_products_stock_non_negative" CHECK ("stock" >= 0), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "movements" ADD CONSTRAINT "FK_0536efaa7e21b101f827a7c62f6" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`);
        await queryRunner.query(`ALTER TABLE "movements" DROP CONSTRAINT "FK_0536efaa7e21b101f827a7c62f6"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_movements_product_created"`);
        await queryRunner.query(`DROP TABLE "movements"`);
        await queryRunner.query(`DROP TYPE "public"."movement_type"`);
    }

}
