use anchor_lang::prelude::*;

declare_id!("1o1owUQqURMoQY7ydHN6hjqUiQRniHBbgJXb1TMRG2j");

pub const TICKET: &[u8] = b"ticket";

#[program]
pub mod workshop_solana_lottery {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.lottery.authority = *ctx.accounts.authority.key;
        Ok(())
    }

    pub fn enter(ctx: Context<Enter>) -> Result<()> {
        ctx.accounts.ticket.number = ctx.accounts.lottery.tickets;
        ctx.accounts.lottery.tickets += 1;
        Ok(())
    }

    pub fn pick_winner(ctx: Context<PickWinner>) -> Result<()> {
        // An overly-simple rng- do not use in production!
        let clock = Clock::get()?;
        let winning_ticket = clock.unix_timestamp as u64 % ctx.accounts.lottery.tickets;
        ctx.accounts.lottery.winner = Some(winning_ticket);
        Ok(())
    }

    pub fn withdraw(_ctx: Context<Withdraw>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = Lottery::SIZE,
    )]
    pub lottery: Account<'info, Lottery>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Enter<'info> {
    #[account(mut)]
    pub lottery: Account<'info, Lottery>,

    #[account(
        init,
        payer = applicant,
        seeds = [lottery.key().as_ref(), applicant.key().as_ref(), TICKET],
        bump,
        space = Ticket::SIZE,
    )]
    pub ticket: Account<'info, Ticket>,

    #[account(mut)]
    pub applicant: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PickWinner<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub lottery: Account<'info, Lottery>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        close = winner,
    )]
    pub lottery: Account<'info, Lottery>,
    pub winner: Signer<'info>,
    #[account(
        constraint = Some(ticket.number) == lottery.winner,
        seeds = [lottery.key().as_ref(), winner.key().as_ref(), TICKET],
        bump,
    )]
    pub ticket: Account<'info, Ticket>,
}

#[account]
#[derive(Default)]
pub struct Lottery {
    pub authority: Pubkey,
    pub winner: Option<u64>,
    pub tickets: u64,
}
impl Lottery {
    pub const SIZE: usize = 32 + (8 + 1) + 8 + 8;
}

#[account]
pub struct Ticket {
    pub number: u64,
}
impl Ticket {
    pub const SIZE: usize = 8 + 8;
}