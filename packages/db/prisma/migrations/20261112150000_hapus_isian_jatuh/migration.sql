-- Isian risiko jatuh tidak ada di formulir rekam medis klinik.
ALTER TABLE `keperawatan` DROP COLUMN `jatuh_tidak_seimbang`,
    DROP COLUMN `jatuh_menopang`;
